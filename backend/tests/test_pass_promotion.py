SESSION = {"X-SSD-Session": "test-session"}


def test_manual_flag_promotes_an_unflagged_pass(client):
    path = "/api/passes/Cba002-001"
    original = client.get(path, headers=SESSION).json()
    assert original["classification"] != "Candidate"
    payload = {"flagged_manually": True}
    assert client.patch(path, json=payload).status_code == 401
    response = client.patch(path, headers=SESSION, json=payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated == {**original, "flagged_manually": True}
    assert client.get(path, headers=SESSION).json() == updated
    matches = client.get("/api/passes?clip=Cba002&track_id=1", headers=SESSION)
    assert matches.json() == [updated]
