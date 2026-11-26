"""Print the path to a locally staged demo clip."""

import argparse
import os
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
CLIPS = ("Cba002", "Cba052", "Cba065")


def locate_clip(clip):
    filename = f"{clip}.mp4"
    configured = os.environ.get("SSD_FOOTAGE_DIR")
    roots = (
        Path(configured) if configured else None,
        Path("/workspace/demo-map/footage/raw"),
        REPO / "data/footage/raw",
        REPO / "footage/raw",
    )
    for root in roots:
        if root is not None and (root / filename).is_file():
            return (root / filename).resolve()
    raise FileNotFoundError(f"{filename} missing. Set SSD_FOOTAGE_DIR to the clip directory.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("clip", choices=CLIPS)
    args = parser.parse_args()
    try:
        print(locate_clip(args.clip))
    except FileNotFoundError as error:
        parser.exit(1, f"{error}\n")
