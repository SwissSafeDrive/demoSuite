"""Load the backend's local settings, with process environment taking precedence."""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_KEYS = {
    "SSD_SESSION_TOKEN",
    "DEMO_ASSETS_READ_SAS_URL",
    "SSD_ASSET_CACHE_DIR",
    "SSD_PORT",
}


def load_settings():
    try:
        lines = (REPO_ROOT / ".env.local").read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        lines = []
    settings = {}
    for line in lines:
        if line.lstrip().startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if separator and key.strip() in LOCAL_KEYS:
            settings[key.strip()] = value.strip()
    settings.update({key: os.environ[key] for key in LOCAL_KEYS if key in os.environ})
    return settings
