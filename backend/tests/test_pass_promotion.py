SESSION = {"X-SSD-Session": "test-session"}


def test_manual_flag_promotes_an_unflagged_pass(client):
    path = "/api/passes/Cba002-001"
    original = client.get(path, headers=SESSION).json()
    assert original["classification"] != "Candidate"
    payload = {"flagged_manually": True}
    assert client.patch(f"{path}/flag", json=payload).status_code == 401
    response = client.patch(f"{path}/flag", headers=SESSION, json=payload)
    assert response.status_code == 200
    assert response.json() == {"passId": original["passId"], "flagged_manually": True}
    updated = {**original, "flagged_manually": True}
    assert client.get(path, headers=SESSION).json() == updated
    matches = client.get("/api/passes?clip=Cba002&track_id=1", headers=SESSION)
    assert matches.json() == [{key: value for key, value in updated.items()
                               if key not in ("state", "operator_id", "decision_at")}]
