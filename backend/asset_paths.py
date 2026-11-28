"""Resolve local media overrides and the demo asset cache."""

import os
from pathlib import Path

from .config import REPO_ROOT, load_settings


def asset_cache_directory(settings=None):
    if settings is None:
        settings = load_settings()
    return Path(settings.get("SSD_ASSET_CACHE_DIR") or REPO_ROOT / ".demo-assets")


def footage_directory(cache=None):
    return Path(os.environ.get("SSD_FOOTAGE_DIR") or (cache or asset_cache_directory()) / "footage")


def crop_directory(cache=None):
    return Path(os.environ.get("SSD_CROP_DIR") or (cache or asset_cache_directory()) / "windshield-crops")
