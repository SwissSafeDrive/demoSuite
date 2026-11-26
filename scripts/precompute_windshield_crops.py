"""Build the local windshield crop index and JPEG strips for the demo clips."""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

import cv2
import numpy as np

from locate_footage import CLIPS, locate_clip


ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "backend"), "/workspace/demo-map/overlay_v2"]

from crop_storage import crop_directory
from pass_fixture import load_passes
from windshield_crop import WindshieldPad, crop_windshield


PAD = WindshieldPad(roof=0.15, hood=0.12, side=0.06)
# Match the distant-glass cutoff in /workspace/demo-map/tracker/bridge_passes.py.
MIN_GLASS_AREA = 6000


def plate_blur(image, box):
    """Blur the full lower front, as in /workspace/demo-map/overlay_v2/render_overlay_v5.py."""
    x1, y1, x2, y2 = box
    left, top, right, bottom = np.rint([x1, y1 + .65 * (y2 - y1), x2, y2 + 8]).astype(int)
    left, right = np.clip([left, right], 0, image.shape[1])
    top, bottom = np.clip([top, bottom], 0, image.shape[0])
    patch = image[top:bottom, left:right]
    if patch.size:
        sigma = max(8, (x2 - x1) * .045)
        patch[:] = cv2.GaussianBlur(patch, (0, 0), sigma, borderType=cv2.BORDER_REPLICATE)


def render_clip(clip, records, staging, generation, index):
    boxes_by_frame = defaultdict(list)
    crops_by_frame = defaultdict(list)
    for record in records:
        pass_id = record["passId"]
        snapshots = {snapshot["frame"]: snapshot for snapshot in record["best_snapshots"]}
        for frame, box, quad in record["geometry"]:
            if snapshot := snapshots.get(frame):
                box = snapshot["box_px"]
                quad = snapshot["windshield_quad_px"]
            boxes_by_frame[frame].append(box)
            if record["classification"] != "Not assessable" and quad is not None:
                if cv2.contourArea(np.asarray(quad, dtype=np.float32)) >= MIN_GLASS_AREA:
                    crops_by_frame[frame].append((pass_id, quad))

    if not crops_by_frame:
        return
    capture = cv2.VideoCapture(str(locate_clip(clip)))
    try:
        first = min(crops_by_frame)
        if not capture.set(cv2.CAP_PROP_POS_FRAMES, first):
            raise OSError(f"{clip}: could not seek to frame {first}")
        for frame in range(first, max(crops_by_frame) + 1):
            if not capture.grab():
                raise OSError(f"{clip}: could not read frame {frame}")
            if frame not in crops_by_frame:
                continue
            ok, source = capture.retrieve()
            if not ok:
                raise OSError(f"{clip}: could not decode frame {frame}")
            for box in boxes_by_frame[frame]:
                plate_blur(source, box)
            for pass_id, quad in crops_by_frame[frame]:
                crop = crop_windshield(source, quad, pad=PAD)
                if crop is None:
                    continue
                relative = Path(pass_id) / f"{frame}.jpg"
                path = staging / relative
                path.parent.mkdir(exist_ok=True)
                if not cv2.imwrite(str(path), crop, [cv2.IMWRITE_JPEG_QUALITY, 90]):
                    raise OSError(f"{pass_id}: could not write frame {frame}")
                index[pass_id]["status"] = "available"
                index[pass_id]["frames"][str(frame)] = (generation / relative).as_posix()
    finally:
        capture.release()


def batch(records):
    directory = crop_directory()
    directory.mkdir(parents=True, exist_ok=True)
    index = {
        record["passId"]: {"status": "Not assessable", "frames": {}}
        for record in records
    }
    # Publish the index only after all its images exist. Retain prior generations
    # so image requests already using an older index can still complete.
    generation = Path(uuid4().hex)
    with TemporaryDirectory(dir=directory) as temporary:
        staging = Path(temporary) / "images"
        staging.mkdir()
        for clip in CLIPS:
            render_clip(
                clip, [record for record in records if record["clip"]["id"] == clip],
                staging, generation, index,
            )
        manifest = Path(temporary) / "index.json"
        manifest.write_text(json.dumps(index, separators=(",", ":")) + "\n", encoding="utf-8")
        staging.rename(directory / generation)
        manifest.replace(directory / "index.json")
    return index


if __name__ == "__main__":
    argparse.ArgumentParser(description=__doc__).parse_args()
    cv2.setNumThreads(4)
    index = batch(load_passes().values())
    images = sum(len(entry["frames"]) for entry in index.values())
    print(f"Wrote {images} crops for {len(index)} Passes to {crop_directory()}")
