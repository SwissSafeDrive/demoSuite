import json
from pathlib import Path


SESSION = {"X-SSD-Session": "test-session"}
FIXTURE = Path(__file__).resolve().parents[1] / "fixtures/passes.json"


def test_all_fixture_passes_are_addressable(client):
    listed = client.get("/api/passes", headers=SESSION)
    assert listed.status_code == 200
    records = json.loads(FIXTURE.read_text())
    assert len(records) == 131
    assert {record["passId"] for record in listed.json()} == {record["passId"] for record in records}
    for record in records:
        response = client.get(f"/api/passes/{record['passId']}", headers=SESSION)
        assert response.status_code == 200
        assert response.json() == record

    matches = client.get("/api/passes?clip=Cba065&track_id=42", headers=SESSION)
    assert [record["passId"] for record in matches.json()] == ["Cba065-042"]


def test_unknown_pass_is_reported_and_route_requires_a_session(client):
    assert client.get("/api/passes/unknown", headers=SESSION).status_code == 404
    assert client.get("/api/passes/Cba002-068").status_code == 401
