import os
from pathlib import Path


def crop_directory():
    return Path(os.environ.get("SSD_CROP_DIR") or "/workspace/demo-map/windshield-crops")
