import json

import pytest


SESSION = {"X-SSD-Session": "test-session"}


def test_browser_session_lists_english_records(client):
    response = client.get("/api/records", headers=SESSION)
    assert response.status_code == 200
    record = response.json()[0]
    assert {
        "confidence", "location", "demo_id", "image_path", "state",
        "decision_at", "origin", "notice", "event_id",
    } <= record.keys()
    assert record["origin"] == "simulated"
    assert "demo station" in record["location"].lower()
    assert "Privacy by Design" in record["notice"]

    statistics = client.get("/api/statistics", headers=SESSION)
    assert statistics.status_code == 200
    assert statistics.json()["total"] == len(response.json())


@pytest.mark.parametrize("headers", [{}, {"X-SSD-Session": ""}])
def test_records_require_nonempty_session(client, headers):
    assert client.get("/api/records", headers=headers).status_code == 401


def test_review_controls_work_after_returning_to_same_record(client):
    records = client.get("/api/records", headers=SESSION).json()
    path = f"/api/records/{records[0]['id']}"
    for state in ("discarded", "reviewed", "confirmed"):
        # Reopen the same record as the case view would after a seek.
        assert client.get(path, headers=SESSION).status_code == 200
        response = client.patch(f"{path}/decision", headers=SESSION, json={"state": state})
        assert response.status_code == 200
        assert response.json()["state"] == state
        assert response.json()["decision_at"]


def test_pass_review_survives_seeking_from_bridge_to_approach(client, tmp_path, monkeypatch):
    monkeypatch.setenv("SSD_CROP_DIR", str(tmp_path))
    (tmp_path / "crop.jpg").write_bytes(b"local crop sample")
    (tmp_path / "index.json").write_text(json.dumps({
        "Cba002-068": {"status": "available", "frames": {"1190": "crop.jpg", "1203": "crop.jpg"}},
    }))
    pass_path = "/api/passes/Cba002-068"
    opened = client.post(f"{pass_path}/record", headers=SESSION)
    opened.raise_for_status()
    record_path = f"/api/records/{opened.json()['id']}"

    for frame, crop_status, state in (
        (1203, 200, "reviewed"), (942, 404, "discarded"), (1190, 200, "confirmed"),
    ):
        # Fetch the displayed crop as the case view does after each seek.
        crop = client.get(f"{pass_path}/crops/{frame}", headers=SESSION)
        assert crop.status_code == crop_status
        saved = client.patch(f"{record_path}/decision", headers=SESSION, json={"state": state})
        saved.raise_for_status()
        reopened = client.post(f"{pass_path}/record", headers=SESSION)
        reopened.raise_for_status()
        assert reopened.json()["id"] == opened.json()["id"]
        assert reopened.json()["state"] == state
