"""Resolve local media overrides and the demo asset cache."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def asset_cache_directory():
    return Path(os.environ.get("SSD_ASSET_CACHE_DIR") or REPO_ROOT / ".demo-assets")


def footage_directory():
    return Path(os.environ.get("SSD_FOOTAGE_DIR") or asset_cache_directory() / "footage")


def crop_directory():
    return Path(os.environ.get("SSD_CROP_DIR") or asset_cache_directory() / "windshield-crops")
