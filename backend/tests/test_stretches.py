import pytest


@pytest.mark.parametrize(
    ("pass_id", "start_frame", "end_frame", "start_time", "end_time", "duration"),
    [
        ("Cba002-068", 1190, 1207, 47.60, 48.28, 0.72),
        ("Cba052-028", 906, 934, 36.24, 37.36, 1.16),
        ("Cba065-045", 1032, 1052, 41.28, 42.08, 0.84),
    ],
)
def test_pass_returns_phone_stretch(client, pass_id, start_frame, end_frame, start_time, end_time, duration):
    response = client.get(f"/api/passes/{pass_id}", headers={"X-SSD-Session": "test-session"})
    response.raise_for_status()
    assert response.json()["behaviours"] == [
        {
            "type": "phone_in_hand",
            "start": {"frame": start_frame, "time_s": start_time},
            "end": {"frame": end_frame, "time_s": end_time},
            "duration_s": duration,
            "label": "SIMULATED SIGNAL",
        }
    ]
