import json
import re
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "backend/fixtures/passes.json"
CANDIDATES = {
    "Cba002-068": (1203, [(942, .20), (1090, .32), (1190, .60), (1203, .78), (1212, .74)]),
    "Cba052-028": (927, [(499, .12), (775, .22), (906, .60), (927, .82), (943, .77)]),
    "Cba065-045": (1051, [(743, .16), (957, .28), (1032, .60), (1051, .81), (1054, .78)]),
}


@pytest.fixture(scope="module")
def passes():
    return {record["passId"]: record for record in json.loads(FIXTURE.read_text())}


def test_passes_cover_source_frames_and_document_windshield_availability(passes):
    assert len(passes) == 131
    assert {record["clip"]["id"] for record in passes.values()} == {"Cba002", "Cba052", "Cba065"}
    assert "Cba065-042" in passes

    for pass_id, record in passes.items():
        clip = record["clip"]
        assert clip["filename"] == f"{clip['id']}.mp4"
        assert clip["fps"] == 25
        assert record["track_ids"] == [int(pass_id.split("-")[1])]
        start, end = record["start"], record["end"]
        assert [entry[0] for entry in record["geometry"]] == list(range(start["frame"], end["frame"] + 1))
        for _, box, quad in record["geometry"]:
            assert box[0] < box[2] and box[1] < box[3]
            if quad is not None:
                assert len(quad) == 4 and all(len(point) == 2 for point in quad)
        assert record["flagged_manually"] is False
        if record["class"] == "motorcycle" or record["windshield_visibility"] == "Distant, limited glass detail":
            assert record["classification"] == "Not assessable"
            assert record["best_snapshots"] == []
        elif pass_id not in CANDIDATES:
            assert record["classification"] == "unflagged"
            assert record["best_snapshots"][0]["windshield_quad_px"]
        if pass_id not in CANDIDATES:
            assert record["flag_time"] is None
            assert record["annotations"] == record["behaviours"] == []


@pytest.mark.parametrize("pass_id", CANDIDATES)
def test_candidates_keep_simulated_knots_and_flag_at_bridge(passes, pass_id):
    bridge, knots = CANDIDATES[pass_id]
    record = passes[pass_id]
    assert record["classification"] == "Candidate"
    snapshot = record["best_snapshots"][0]
    assert snapshot["frame"] == bridge
    assert snapshot["box_px"][3] > 2500
    assert snapshot["windshield_quad_px"]
    assert record["flag_time"] == {"frame": bridge, "time_s": bridge / 25}
    assert (record["start"]["frame"], record["end"]["frame"]) == (knots[0][0], knots[-1][0])
    assert [(k["frame"], k["confidence"]) for k in record["annotations"]] == knots
    for knot in record["annotations"]:
        assert knot["label"] == "SIMULATED SIGNAL"
        assert knot["time_s"] == knot["frame"] / 25
    stretch, = record["behaviours"]
    assert stretch["type"] == "phone_in_hand"
    assert stretch["label"] == "SIMULATED SIGNAL"
    assert stretch["start"]["frame"] <= bridge <= stretch["end"]["frame"]


def test_repository_payload_has_no_storage_credentials():
    pattern = re.compile(
        rb"blob[.]core[.]windows[.]net|\bsig" + rb"=|accountkey" + rb"=|"
        rb"sharedaccesssignature" + rb"=|sv" + rb"=[^\s&]+&",
        re.IGNORECASE,
    )
    files = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=ROOT
    ).decode().split("\0")
    for filename in filter(None, files):
        path = ROOT / filename
        if path.is_file():
            assert not pattern.search(path.read_bytes()), filename


@pytest.mark.parametrize("pass_id", CANDIDATES)
def test_case_presents_bridge_snapshot_and_flag_time(client, pass_id):
    bridge, _ = CANDIDATES[pass_id]
    result = client.get(f"/api/passes/{pass_id}", headers={"X-SSD-Session": "test-session"})
    result.raise_for_status()
    record = result.json()
    assert record["flag_time"] == {"frame": bridge, "time_s": bridge / 25}
    assert [(snapshot["frame"], snapshot["time_s"]) for snapshot in record["best_snapshots"]] == [
        (bridge, bridge / 25)
    ]
