import json
from functools import lru_cache

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from crop_storage import crop_directory
from pass_fixture import load_passes


router = APIRouter(prefix="/api/passes")


@lru_cache(maxsize=1)
def read_index(path, identity):
    return json.loads(path.read_text(encoding="utf-8"))


def crop_entry(pass_id):
    record = load_passes().get(pass_id)
    if record is None:
        raise HTTPException(404, "Pass not found")
    if record["classification"] == "Not assessable":
        return record, {"status": "Not assessable", "frames": {}}

    index = crop_directory() / "index.json"
    try:
        stat = index.stat()
        entry = read_index(index, (stat.st_ino, stat.st_mtime_ns, stat.st_size)).get(pass_id)
    except FileNotFoundError:
        entry = None
    if entry is None:
        entry = {"status": "Not assessable", "frames": {}}
    return record, entry


@router.get("/{pass_id}/crops")
def list_crops(pass_id: str):
    record, entry = crop_entry(pass_id)
    fps = record["clip"]["fps"]
    return {
        "passId": pass_id,
        "clipId": record["clip"]["id"],
        "trackIds": record["track_ids"],
        "fps": fps,
        "status": entry["status"],
        "frames": [
            {"frame": frame, "time_s": frame / fps, "url": f"/api/passes/{pass_id}/crops/{frame}"}
            for frame in sorted(map(int, entry["frames"]))
        ],
    }


@router.get("/{pass_id}/crops/{frame}")
def get_crop(pass_id: str, frame: int):
    _, entry = crop_entry(pass_id)
    relative = entry["frames"].get(str(frame))
    if entry["status"] == "available" and relative:
        root = crop_directory().resolve()
        path = (root / relative).resolve()
        if path.is_relative_to(root) and path.suffix == ".jpg" and path.is_file():
            return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "no-store"})
    raise HTTPException(404, "Crop image not found")
