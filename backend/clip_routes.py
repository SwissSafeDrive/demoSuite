"""Serve local footage and its frame-indexed overlay to the demo player."""

import hashlib
import hmac
import secrets
import time
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from footage import CLIPS, locate_clip
from overlay import clip_overlay
from pass_fixture import load_passes


@lru_cache(maxsize=len(CLIPS))
def overlay_for_clip(clip_id):
    return clip_overlay(load_passes().values(), clip_id)


def clip_path(clip_id):
    if clip_id in CLIPS:
        try:
            return locate_clip(clip_id)
        except FileNotFoundError:
            pass
    raise HTTPException(404, "Demo clip unavailable")


def create_clip_router(verify_session):
    router = APIRouter(prefix="/api/clips")
    playback_key = secrets.token_bytes(32)

    def signature(clip_id, expires):
        message = f"{clip_id}:{expires}".encode()
        return hmac.new(playback_key, message, hashlib.sha256).hexdigest()

    @router.get("/{clip_id}/playback", dependencies=[Depends(verify_session)])
    def playback(clip_id: str):
        clip_path(clip_id)
        # Native video requests cannot attach the API session header.
        expires = int(time.time()) + 3600
        return {
            **overlay_for_clip(clip_id),
            "mediaPath": f"/api/clips/{clip_id}?expires={expires}&signature={signature(clip_id, expires)}",
        }

    @router.get("/{clip_id}")
    @router.head("/{clip_id}", include_in_schema=False)
    def video(
        clip_id: str,
        expires: int = 0,
        supplied_signature: str = Query(default="", alias="signature"),
    ):
        if expires <= time.time() or not hmac.compare_digest(
            supplied_signature.encode(), signature(clip_id, expires).encode()
        ):
            raise HTTPException(401, "Playback authorization expired or invalid")
        return FileResponse(
            clip_path(clip_id),
            media_type="video/mp4",
            headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
        )

    return router
