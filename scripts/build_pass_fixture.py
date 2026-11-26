"""Export Pass geometry from saved demo tracks and the local v5 prototype."""

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np


OUTPUT = Path(__file__).resolve().parents[1] / "backend/fixtures/passes.json"
DEMO_MAP = Path("/workspace/demo-map")
CANDIDATE_THRESHOLD = .60
SIMULATED = "SIMULATED SIGNAL"
BRIDGE_FRAMES = {"Cba002-068": 1203, "Cba052-028": 927, "Cba065-045": 1051}
PHONE_STRETCHES = {"Cba002-068": (1190, 1207), "Cba052-028": (906, 934), "Cba065-045": (1032, 1052)}


def load_tracks(footage, clip, coordinates):
    tracks = defaultdict(dict)
    with (footage / "tracks" / f"{clip}_tracks.csv").open(newline="") as source:
        for row in csv.DictReader(source):
            tracks[int(row["track_id"])][int(row["frame"])] = [
                float(row[key]) for key in coordinates
            ]
    return tracks


def classification(usable, knots):
    if not usable:
        return "Not assessable"
    peak = max((confidence for _, confidence in knots), default=0)
    if peak >= CANDIDATE_THRESHOLD:
        return "Candidate"
    if peak >= .40:
        return "Uncertain"
    return "unflagged"


def export_pass(item, track, rule, prototype):
    pass_id = item["pass_id"]
    clip = item["clip"]
    first, last = item["first_frame"], item["last_frame"]
    fps = prototype.FPS
    knots = prototype.PASSES.get(pass_id, [])
    usable = (
        item["windshield_visible"] == "Estimated glass"
        and item["quality"] is not None
        and item["windshield_quad_px"] is not None
    )
    state = classification(usable, knots)

    def instant(frame):
        return {"frame": frame, "time_s": frame / fps}

    if first not in track or last not in track:
        raise ValueError(f"{pass_id}: track does not cover the Pass boundaries")

    frames = range(first, last + 1)
    observed = sorted(frame for frame in track if first <= frame <= last)
    columns = np.array([track[frame] for frame in observed]).T
    boxes = np.array([np.interp(frames, observed, column) for column in columns]).T
    exit_glass = prototype.EXIT_GLASS.get(pass_id)
    geometry = []
    for frame, box in zip(frames, boxes):
        quad = None
        if item["class"] != "motorcycle" and (exit_glass is None or frame < exit_glass[0]):
            quad = prototype.geometry(clip, item["class"], box, rule, pass_id).astype(float)
            if exit_glass:
                positions, offsets = zip(*exit_glass[1])
                quad[:, 1] += np.interp(frame, positions, offsets) * (box[3] - box[1])
            quad = quad.round(2).tolist()
        geometry.append([frame, box.round(2).tolist(), quad])

    snapshots = []
    if usable:
        bridge = BRIDGE_FRAMES.get(pass_id, item["best_frame"])
        if bridge == item["best_frame"]:
            snapshot_box = item["best_box_px"]
            snapshot_quad = item["windshield_quad_px"]
        else:
            _, snapshot_box, snapshot_quad = geometry[bridge - first]
        snapshots.append({
            **instant(bridge),
            "box_px": snapshot_box,
            "windshield_quad_px": snapshot_quad,
        })

    behaviours = []
    if pass_id in PHONE_STRETCHES:
        start, end = PHONE_STRETCHES[pass_id]
        behaviours.append({
            "type": "phone_in_hand",
            "start": instant(start),
            "end": instant(end),
            "duration_s": (end - start + 1) / fps,
            "label": SIMULATED,
        })

    return {
        "passId": pass_id,
        "clip": {
            "id": clip,
            "filename": f"{clip}.mp4",
            "fps": fps,
            "width": prototype.WIDTH,
            "height": prototype.HEIGHT,
        },
        "start": instant(first),
        "end": instant(last),
        "track_ids": [item["track_id"]],
        "class": item["class"],
        "geometry": geometry,
        "windshield_visibility": item["windshield_visible"],
        "best_snapshots": snapshots,
        "flag_time": instant(snapshots[0]["frame"]) if state == "Candidate" else None,
        "classification": state,
        "flagged_manually": False,
        "annotations": [
            {**instant(frame), "type": "phone_confidence", "confidence": value, "label": SIMULATED}
            for frame, value in knots
        ],
        "behaviours": behaviours,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--demo-map", type=Path, default=DEMO_MAP)
    args = parser.parse_args()
    root = args.demo_map.resolve()
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(root / "overlay_v2"))
    import render_overlay_v5 as prototype

    footage = root / "footage"
    passes = json.loads((footage / "passes/passes.json").read_text())
    rule = json.loads((root / "tracker/windshield_rule_bridge.json").read_text())
    tracks = {
        clip: load_tracks(footage, clip, prototype.COORDS)
        for clip in {item["clip"] for item in passes}
    }
    records = [
        export_pass(item, tracks[item["clip"]][item["track_id"]], rule, prototype)
        for item in sorted(passes, key=lambda item: item["pass_id"])
    ]
    OUTPUT.write_text("[\n" + ",\n".join(json.dumps(record, separators=(",", ":"))
                                          for record in records) + "\n]\n", encoding="utf-8")


if __name__ == "__main__":
    main()
