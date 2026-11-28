import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SSD_SESSION_TOKEN", "test-session")
    monkeypatch.setenv("SSD_ASSET_CACHE_DIR", str(tmp_path))
    monkeypatch.delenv("SSD_FOOTAGE_DIR", raising=False)
    monkeypatch.delenv("SSD_CROP_DIR", raising=False)

    from backend.main import create_app

    with TestClient(create_app()) as client:
        yield client
