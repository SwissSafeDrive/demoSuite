from pathlib import Path

from backend.asset_paths import crop_directory, footage_directory


def test_default_media_paths_are_relative_to_repository(monkeypatch):
    for name in ("SSD_ASSET_CACHE_DIR", "SSD_CROP_DIR", "SSD_FOOTAGE_DIR"):
        monkeypatch.delenv(name, raising=False)
    cache = Path(__file__).resolve().parents[2] / ".demo-assets"
    assert footage_directory() == cache / "footage"
    assert crop_directory() == cache / "windshield-crops"


def test_local_footage_override_takes_precedence_over_cache(client, tmp_path, monkeypatch):
    cache_footage = tmp_path / "footage"
    cache_footage.mkdir()
    (cache_footage / "Cba052.mp4").touch()
    override = tmp_path / "override"
    override.mkdir()
    monkeypatch.setenv("SSD_FOOTAGE_DIR", str(override))
    headers = {"X-SSD-Session": "test-session"}
    path = "/api/clips/Cba052/playback"
    assert client.get(path, headers=headers).status_code == 404
    (override / "Cba052.mp4").touch()
    assert client.get(path, headers=headers).status_code == 200
