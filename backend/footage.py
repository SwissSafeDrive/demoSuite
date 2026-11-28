"""Locate demo clips in the configured footage directory."""

from .asset_paths import footage_directory

CLIPS = ("Cba002", "Cba052", "Cba065")


def locate_clip(clip):
    path = footage_directory() / f"{clip}.mp4"
    if path.is_file():
        return path.resolve()
    raise FileNotFoundError(path)
