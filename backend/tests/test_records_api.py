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
