import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def isolate_local_config(tmp_path, monkeypatch):
    from backend import config

    monkeypatch.setattr(config, "REPO_ROOT", tmp_path)
    monkeypatch.setenv("DEMO_ASSETS_READ_SAS_URL", "")


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SSD_SESSION_TOKEN", "test-session")
    monkeypatch.setenv("SSD_ASSET_CACHE_DIR", str(tmp_path))
    monkeypatch.delenv("SSD_FOOTAGE_DIR", raising=False)
    monkeypatch.delenv("SSD_CROP_DIR", raising=False)

    from backend.main import create_app

    with TestClient(create_app()) as client:
        yield client
