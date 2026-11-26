"""Print the path to a locally staged demo clip."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.footage import CLIPS, locate_clip


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("clip", choices=CLIPS)
    args = parser.parse_args()
    try:
        print(locate_clip(args.clip))
    except FileNotFoundError as error:
        parser.exit(1, f"{error}\n")
