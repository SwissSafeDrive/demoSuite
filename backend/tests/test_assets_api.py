import hashlib
import json
import logging
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Event, Thread
from urllib.parse import urlsplit
from urllib.request import urlopen

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app

SESSION = {"X-SSD-Session": "test-session"}
FAKE_HOST = ".".join(("teststore", "blob", "core", "windows", "net"))
FAKE_SAS = f"https://{FAKE_HOST}/?sample=private-test-value"
CONTAINER_SAS = FAKE_SAS.replace("/?", "/custom-container?")
CROP_PATH = "windshield-crops/sample/Cba002-068/1203.jpg"


@pytest.fixture
def asset_site():
    class Site:
        files = {}
        requests = []
        paths = []
        manifest_gate = None
        interrupted = None
        rejected = False

    site = Site()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            path = urlsplit(self.path).path
            name = next((key for key in site.files if path.endswith("/" + key)), "manifest.json")
            site.paths.append(path)
            site.requests.append(name)
            if site.rejected:
                self.send_error(403)
                return
            if name == "manifest.json":
                if site.manifest_gate is not None:
                    site.manifest_gate.wait(timeout=3)
                body = json.dumps({
                    "version": 1,
                    "files": [
                        {"path": key, "size": len(value), "sha256": hashlib.sha256(value).hexdigest()}
                        for key, value in site.files.items()
                    ],
                }).encode()
            else:
                body = site.files[name]
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body[:1] if site.interrupted == name else body)

    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()

        def open_local(url):
            parts = urlsplit(url)
            return urlopen(f"http://127.0.0.1:{server.server_port}{parts.path}?{parts.query}", timeout=3)

        site.open = open_local
        try:
            yield site
        finally:
            server.shutdown()
            thread.join()


@pytest.fixture
def asset_client(asset_site, tmp_path, monkeypatch):
    @contextmanager
    def open_client(sas=None):
        if sas is not None:
            monkeypatch.setenv("SSD_SESSION_TOKEN", SESSION["X-SSD-Session"])
            monkeypatch.setenv("SSD_ASSET_CACHE_DIR", str(tmp_path / "cache"))
            monkeypatch.setenv("DEMO_ASSETS_READ_SAS_URL", sas)
        with TestClient(create_app(asset_opener=asset_site.open)) as client:
            yield client

    return open_client


def settled(client, headers=SESSION):
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        response = client.get("/api/assets/status", headers=headers)
        assert response.status_code == 200
        status = response.json()
        if status["state"] in {"missing_sas", "ready", "error", "sas_rejected"}:
            return status
        time.sleep(0.01)
    pytest.fail("Asset sync did not settle")


def retry(client):
    assert client.post("/api/assets/retry", headers=SESSION).status_code == 202


def test_health_is_open(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_missing_sas_status_requires_session(client):
    assert client.get("/api/assets/status").status_code == 401
    status = client.get("/api/assets/status", headers={"X-SSD-Session": "test-session"}).json()
    assert status["state"] == "missing_sas"
    assert status["sas_configured"] is False


def test_sync_verifies_cache_and_serves_media(asset_site, asset_client, tmp_path):
    cached = tmp_path / "cache"
    assets = {
        "footage/Cba002.mp4": b"correct",
        "footage/Cba052.mp4": b"another",
        CROP_PATH: b"jpeg",
        "windshield-crops/index.json": json.dumps(
            {"Cba002-068": {"status": "available", "frames": {"1203": CROP_PATH.split("/", 1)[1]}}}
        ).encode(),
    }
    asset_site.files.update(assets)
    for name, data in {
        "footage/Cba002.mp4": b"corrupt",
        "footage/Cba052.mp4": b"short",
        CROP_PATH: b"jpeg",
    }.items():
        path = cached / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    with asset_client(FAKE_SAS) as client:
        status = settled(client)
        assert status["state"] == "ready"
        assert status["bytes_done"] == status["bytes_total"] == sum(map(len, assets.values()))
        assert status["files_done"] == status["files_total"] == len(assets)
        assert status["sas_source"] == "env"
        assert set(asset_site.requests) == {"manifest.json", *assets.keys()} - {CROP_PATH}
        assert asset_site.paths[0] == "/demo-assets/v1/manifest.json"
        assert (cached / "manifest.json").is_file()

        for name, data in assets.items():
            assert (cached / name).read_bytes() == data
        playback = client.get("/api/clips/Cba002/playback", headers=SESSION)
        assert playback.status_code == 200
        assert client.head(playback.json()["mediaPath"]).status_code == 200
        crop = client.get("/api/passes/Cba002-068/crops/1203", headers=SESSION)
        assert crop.content == b"jpeg"

        asset_site.requests.clear()
        retry(client)
        assert settled(client)["bytes_downloaded"] == 0
        assert asset_site.requests == ["manifest.json"]

        asset_site.files["footage/Cba002.mp4"] = b"changed"
        asset_site.requests.clear()
        retry(client)
        assert settled(client)["bytes_downloaded"] == len(b"changed")
        assert asset_site.requests == ["manifest.json", "footage/Cba002.mp4"]


def test_retry_replaces_interrupted_file_and_keeps_verified_files(asset_site, asset_client, tmp_path):
    asset_site.files.update({"footage/Cba002.mp4": b"first", "footage/Cba052.mp4": b"second"})
    cache = tmp_path / "cache"
    (cache / "footage").mkdir(parents=True)
    (cache / "footage/Cba002.mp4").write_bytes(b"first")
    asset_site.interrupted = "footage/Cba052.mp4"
    with asset_client(FAKE_SAS) as client:
        assert settled(client)["state"] == "error"
        assert (cache / "footage/Cba002.mp4").read_bytes() == b"first"
        assert not (cache / "footage/Cba052.mp4").exists()
        assert not list(cache.rglob("*.part"))
        asset_site.requests.clear()
        asset_site.interrupted = None
        retry(client)
        assert settled(client)["state"] == "ready"
        assert asset_site.requests == ["manifest.json", "footage/Cba052.mp4"]


def test_paste_and_rejected_sas_keep_the_secret_private(asset_site, asset_client, tmp_path, caplog):
    asset_site.rejected = True
    with caplog.at_level(logging.DEBUG), asset_client("") as client:
        invalid = client.post("/api/assets/sas", headers=SESSION, json={"url": "http://example.test/?sample=private-test-value"})
        assert invalid.status_code == 400
        assert client.post("/api/assets/sas", json={"url": FAKE_SAS}).status_code == 401
        assert client.post("/api/assets/retry").status_code == 401
        response = client.post("/api/assets/sas", headers=SESSION, json={"url": CONTAINER_SAS})
        assert response.status_code == 202
        status = settled(client)
        assert status["state"] == "sas_rejected"
        assert status["error"]["code"] == "sas_rejected"
        assert "expired or revoked" in status["error"]["message"]
        assert status["sas_configured"] is True
        assert status["sas_source"] == "pasted"
        assert asset_site.paths == ["/custom-container/v1/manifest.json"]
        saved = tmp_path / "cache/.read-sas"
        assert saved.read_text() == CONTAINER_SAS
        assert saved.stat().st_mode & 0o777 == 0o600
        for output in (invalid.text, response.text, json.dumps(status), caplog.text):
            assert "private-test-value" not in output

    asset_site.rejected = False
    with asset_client("") as client:
        assert settled(client)["state"] == "ready"
        assert settled(client)["sas_source"] == "pasted"


def test_env_local_settings_and_environment_precedence(asset_site, asset_client, tmp_path, monkeypatch):
    (tmp_path / ".env.local").write_text(
        f"# Demo settings\nSSD_SESSION_TOKEN=local\nSSD_PORT=9000\n"
        f"SSD_ASSET_CACHE_DIR={tmp_path / 'local-cache'}\n"
        f"DEMO_ASSETS_READ_SAS_URL={FAKE_SAS}\n"
        "DEMO_ASSETS_CONTAINER=custom\nDEMO_ASSETS_PREFIX=alternate/v2\n"
    )
    monkeypatch.delenv("SSD_SESSION_TOKEN", raising=False)
    monkeypatch.delenv("SSD_ASSET_CACHE_DIR", raising=False)
    monkeypatch.delenv("DEMO_ASSETS_READ_SAS_URL", raising=False)
    monkeypatch.setenv("DEMO_ASSETS_PREFIX", "env/v3")
    with asset_client() as client:
        assert settled(client, {"X-SSD-Session": "local"})["state"] == "ready"
        assert (tmp_path / "local-cache/manifest.json").is_file()
        assert asset_site.paths == ["/custom/env/v3/manifest.json"]
        assert client.get("/api/assets/status", headers=SESSION).status_code == 401


def test_media_returns_503_while_cache_is_checking(asset_site, asset_client):
    asset_site.manifest_gate = Event()
    with asset_client(FAKE_SAS) as client:
        try:
            status = client.get("/api/assets/status", headers=SESSION).json()
            assert status["state"] == "checking"
            for path in ("/api/clips/Cba002/playback", "/api/passes/Cba002-068/crops/1203"):
                response = client.get(path, headers=SESSION)
                assert response.status_code == 503
                assert response.json() == {"detail": "Demo assets are not ready"}
        finally:
            asset_site.manifest_gate.set()
        assert settled(client)["state"] == "ready"
