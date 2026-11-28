import json
import pytest


HEADERS = {"X-SSD-Session": "test-session"}
CANDIDATES = [
    ("Cba002-068", 1203, 48.12),
    ("Cba052-028", 927, 37.08),
    ("Cba065-045", 1051, 42.04),
]


@pytest.mark.parametrize("pass_id,frame,time_s", CANDIDATES)
def test_crop_metadata_and_image_require_session(client, tmp_path, monkeypatch, pass_id, frame, time_s):
    monkeypatch.setenv("SSD_CROP_DIR", str(tmp_path))
    relative = f"sample/{pass_id}/{frame}.jpg"
    image = tmp_path / relative
    image.parent.mkdir(parents=True)
    image.write_bytes(b"local crop sample")
    (tmp_path / "index.json").write_text(json.dumps({
        pass_id: {"status": "available", "frames": {str(frame): relative}},
    }))
    route = f"/api/passes/{pass_id}/crops"
    assert client.get(route).status_code == 401
    response = client.get(route, headers=HEADERS)
    url = f"{route}/{frame}"
    assert response.status_code == 200
    assert response.json() == {
        "passId": pass_id, "clipId": pass_id.split("-")[0],
        "trackIds": [int(pass_id.split("-")[1])], "fps": 25,
        "status": "available", "frames": [{"frame": frame, "time_s": time_s, "url": url}],
    }
    assert client.get(url).status_code == 401
    crop = client.get(url, headers=HEADERS)
    assert crop.status_code == 200
    assert crop.headers["content-type"] == "image/jpeg"
    assert crop.content == image.read_bytes()
    assert client.get(f"{route}/{frame + 1}", headers=HEADERS).status_code == 404


def test_unusable_or_missing_crop_metadata_has_no_frames(client, tmp_path, monkeypatch):
    monkeypatch.setenv("SSD_CROP_DIR", str(tmp_path))
    for pass_id in ("Cba002-090", "Cba002-068"):
        route = f"/api/passes/{pass_id}/crops"
        metadata = client.get(route, headers=HEADERS)
        assert metadata.status_code == 200
        assert metadata.json()["status"] == "Not assessable"
        assert metadata.json()["frames"] == []
        assert client.get(f"{route}/1203", headers=HEADERS).status_code == 404
