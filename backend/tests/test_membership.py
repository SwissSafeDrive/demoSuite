SESSION = {"X-SSD-Session": "test-session"}


def test_candidate_list_uses_bridge_decisions(client):
    response = client.get("/api/candidates", headers=SESSION)
    assert response.status_code == 200
    assert {row["passId"]: row["seekTime"] for row in response.json()} == {
        "Cba002-068": 48.12,
        "Cba052-028": 37.08,
        "Cba065-045": 42.04,
    }


def test_manual_flags_admit_unflagged_and_not_assessable_passes(client):
    passes = client.get("/api/passes", headers=SESSION).json()
    not_assessable = next(row["passId"] for row in passes if row["classification"] == "Not assessable")
    for pass_id in ("Cba065-042", not_assessable):
        assert pass_id not in {row["passId"] for row in client.get("/api/candidates", headers=SESSION).json()}
        path = f"/api/passes/{pass_id}"
        assert client.patch(f"{path}/flag", json={"flagged_manually": True}, headers=SESSION).status_code == 200
        assert client.get(path, headers=SESSION).json()["flagged_manually"] is True
        rows = {row["passId"]: row for row in client.get("/api/candidates", headers=SESSION).json()}
        assert rows[pass_id]["flagged_manually"] is True
        assert client.patch(f"{path}/flag", json={"flagged_manually": False}, headers=SESSION).status_code == 200


def test_candidate_scores_are_labeled_as_simulated(client):
    rows = client.get("/api/candidates", headers=SESSION).json()
    assert {row["passId"]: row["signal"]["percent"] for row in rows} == {
        "Cba002-068": 78,
        "Cba052-028": 82,
        "Cba065-045": 81,
    }
    assert all(row["signal"]["label"] == "SIMULATED SIGNAL" for row in rows)


def test_approach_signal_does_not_override_an_uncertain_bridge_signal(client, monkeypatch):
    from backend import main

    passes = main.load_passes()
    candidate = passes["Cba002-068"]
    annotations = [
        {**knot, "confidence": 0.9 if knot["frame"] == candidate["start"]["frame"] else 0.5}
        for knot in candidate["annotations"]
    ]
    uncertain = {**candidate, "classification": "Uncertain", "annotations": annotations}
    monkeypatch.setattr(main, "load_passes", lambda: {**passes, "Cba002-068": uncertain})

    rows = client.get("/api/candidates", headers=SESSION).json()
    assert {row["passId"] for row in rows} == {"Cba052-028", "Cba065-045"}
