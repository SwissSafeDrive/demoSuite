import pytest

from backend.overlay import clip_overlay, overlay_at_time
from backend.pass_fixture import load_passes


def test_playback_then_seek_keeps_neighbour_geometry_separate():
    overlay = clip_overlay(load_passes().values(), "Cba002")
    before = {item["passId"]: item for item in overlay_at_time(overlay, 47.57)}
    assert before["Cba002-068"]["box"] == [2655.12, 1176.82, 3114.41, 1724.82]
    assert before["Cba002-068"]["quad"][0] == [2769.94, 1303.96]
    assert before["Cba002-068"]["boxColor"] == "#3B82F6"

    threshold = {item["passId"]: item for item in overlay_at_time(overlay, 47.60)}
    assert threshold["Cba002-068"]["boxColor"] == "#F97316"
    assert threshold["Cba002-068"]["quadColor"] == "#F97316"

    after = {item["passId"]: item for item in overlay_at_time(overlay, 48.12)}
    assert after["Cba002-068"]["box"] == [2838.72, 1785.96, 3696.45, 2919.65]
    assert after["Cba002-068"]["quad"][0] == [3053.15, 2160.08]
    assert after["Cba002-068"]["signal"] == {
        "percent": 78, "label": "SIMULATED SIGNAL",
    }
    assert after["Cba002-072"]["box"] == [1405.17, 1984.9, 2202.31, 2981.01]
    assert after["Cba002-072"]["quad"][0] == [1604.45, 2303.87]
    assert after["Cba002-072"]["signal"] is None


@pytest.mark.parametrize(
    "clip, pass_id, time_s, box, quad, percent",
    [
        (
            "Cba052", "Cba052-028", 37.08, [1829.03, 1322.11, 2777.59, 2644.93],
            [[2110.28, 1726.7], [2523.41, 1775.95], [2499.55, 2121.71], [1986.97, 2058.32]],
            82,
        ),
        (
            "Cba065", "Cba065-045", 42.04, [2599.48, 851.08, 3588.16, 2765.43],
            [[2927.37, 1750.82], [3441.49, 1731.68], [3510.7, 2171.98], [2818.62, 2171.98]],
            81,
        ),
    ],
)
def test_seek_restores_clip_specific_geometry(clip, pass_id, time_s, box, quad, percent):
    overlay = clip_overlay(load_passes().values(), clip)
    assert pass_id not in {item["passId"] for item in overlay_at_time(overlay, 0)}
    vehicles = {item["passId"]: item for item in overlay_at_time(overlay, time_s)}
    assert vehicles[pass_id]["box"] == box
    assert vehicles[pass_id]["quad"] == quad
    assert vehicles[pass_id]["signal"] == {"percent": percent, "label": "SIMULATED SIGNAL"}
    assert all(item.startswith(f"{clip}-") for item in vehicles)
