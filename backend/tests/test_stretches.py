import pytest


@pytest.mark.parametrize(("pass_id", "start_frame", "start_time", "end_time", "duration"), [
    ("Cba002-068", 1190, 47.60, 48.28, 0.72),
    ("Cba052-028", 906, 36.24, 37.36, 1.16),
    ("Cba065-045", 1032, 41.28, 42.08, 0.84),
])
def test_phone_stretch_seeks_to_its_first_frame(client, pass_id, start_frame, start_time, end_time, duration):
    from backend.pass_analysis import behaviour_stretches

    response = client.get(f"/api/passes/{pass_id}", headers={"X-SSD-Session": "test-session"})
    response.raise_for_status()
    assert behaviour_stretches(response.json()) == [{
        "name": "Phone in hand",
        "seekFrame": start_frame,
        "endFrame": round(end_time * 25),
        "startTime": start_time,
        "endTime": end_time,
        "duration": duration,
        "label": "SIMULATED SIGNAL",
    }]
