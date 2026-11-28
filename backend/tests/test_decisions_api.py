from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app

SESSION = {"X-SSD-Session": "test-session"}
PASS_ID = "Cba052-028"
PASS_PATH = f"/api/passes/{PASS_ID}"
DECISION_PATH = f"{PASS_PATH}/decision"


def test_review_decisions_follow_the_pass_after_playback(client, tmp_path, monkeypatch):
    footage = tmp_path / "footage"
    footage.mkdir()
    monkeypatch.setenv("SSD_FOOTAGE_DIR", str(footage))
    (footage / "Cba052.mp4").write_bytes(b"test footage")
    assert client.get(PASS_PATH, headers=SESSION).json()["state"] == "pending"
    for state in ("discarded", "reviewed", "confirmed", "pending"):
        playback = client.get("/api/clips/Cba052/playback", headers=SESSION)
        playback.raise_for_status()
        media_path = playback.json()["mediaPath"]
        assert client.head(media_path).status_code == 200
        assert client.get(media_path, headers={"Range": "bytes=2-4"}).content == b"st "
        result = client.patch(
            DECISION_PATH, json={"state": state, "operator_id": "test-operator"}, headers=SESSION
        )
        result.raise_for_status()
        decision = result.json()
        assert decision["passId"] == PASS_ID
        assert decision["state"] == state
        assert decision["operator_id"] == "test-operator"
        assert datetime.fromisoformat(decision["decision_at"]).utcoffset() == timedelta(0)
        record = client.get(PASS_PATH, headers=SESSION).json()
        assert {key: record[key] for key in decision} == decision
        assert client.get("/api/passes/Cba002-068", headers=SESSION).json()["state"] == "pending"
        rows = client.get("/api/candidates", headers=SESSION).json()
        assert {row["passId"]: row["state"] for row in rows}[PASS_ID] == state


@pytest.mark.parametrize("headers", [{}, {"X-SSD-Session": ""}, {"X-SSD-Session": "wrong"}])
def test_decision_requires_matching_nonempty_session(client, headers):
    assert client.patch(DECISION_PATH, json={"state": "reviewed"}, headers=headers).status_code == 401


def test_decision_rejects_unknown_pass_and_invalid_state(client):
    assert client.patch(
        "/api/passes/unknown/decision", json={"state": "reviewed"}, headers=SESSION
    ).status_code == 404
    assert client.patch(DECISION_PATH, json={"state": "invalid"}, headers=SESSION).status_code == 422


def test_missing_cache_returns_clip_503(client):
    response = client.get("/api/clips/Cba052/playback", headers=SESSION)
    assert response.status_code == 503
    assert response.json() == {"detail": "Demo assets are not ready"}


def test_new_app_starts_with_pending_decisions_and_original_flags(client):
    assert client.patch(DECISION_PATH, json={"state": "reviewed"}, headers=SESSION).status_code == 200
    assert client.patch(
        f"{PASS_PATH}/flag", json={"flagged_manually": True}, headers=SESSION
    ).status_code == 200
    with TestClient(create_app()) as restarted:
        record = restarted.get(PASS_PATH, headers=SESSION).json()
        assert record["state"] == "pending"
        assert record["flagged_manually"] is False


@pytest.mark.parametrize("configured_token", [None, ""])
def test_unconfigured_session_rejects_requests(monkeypatch, configured_token):
    if configured_token is None:
        monkeypatch.delenv("SSD_SESSION_TOKEN", raising=False)
    else:
        monkeypatch.setenv("SSD_SESSION_TOKEN", configured_token)
    with TestClient(create_app()) as unconfigured:
        assert unconfigured.get("/api/candidates", headers=SESSION).status_code == 401
