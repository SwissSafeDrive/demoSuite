import json
import re
import subprocess
from pathlib import Path

import pytest


HEADERS = {"X-SSD-Session": "test-session"}
CANDIDATES = [
    ("Cba002-068", 1203, 48.12),
    ("Cba052-028", 927, 37.08),
    ("Cba065-045", 1051, 42.04),
]


@pytest.mark.parametrize("pass_id,frame,time_s", CANDIDATES)
def test_crop_metadata_and_image_require_session(client, tmp_path, monkeypatch, pass_id, frame, time_s):
    monkeypatch.setenv("SSD_CROP_DIR", str(tmp_path))
    relative = f"sample/{pass_id}/{frame}.jpg"
    image = tmp_path / relative
    image.parent.mkdir(parents=True)
    image.write_bytes(b"local crop sample")
    (tmp_path / "index.json").write_text(json.dumps({
        pass_id: {"status": "available", "frames": {str(frame): relative}},
    }))
    route = f"/api/passes/{pass_id}/crops"
    assert client.get(route).status_code == 401
    response = client.get(route, headers=HEADERS)
    url = f"{route}/{frame}"
    assert response.status_code == 200
    assert response.json() == {
        "passId": pass_id, "clipId": pass_id.split("-")[0],
        "trackIds": [int(pass_id.split("-")[1])], "fps": 25,
        "status": "available", "frames": [{"frame": frame, "time_s": time_s, "url": url}],
    }
    assert client.get(url).status_code == 401
    crop = client.get(url, headers=HEADERS)
    assert crop.status_code == 200
    assert crop.headers["content-type"] == "image/jpeg"
    assert crop.content == image.read_bytes()
    assert client.get(f"{route}/{frame + 1}", headers=HEADERS).status_code == 404


def test_batch_warps_bridge_samples_and_flags_unusable_passes(client, tmp_path, monkeypatch):
    root = Path(__file__).resolve().parents[2]
    python = Path("/workspace/wt/venv/bin/python")
    if not python.is_file():
        pytest.skip("Crop generator requires the slim tracker venv")
    monkeypatch.setenv("SSD_CROP_DIR", str(tmp_path))
    subprocess.run([python, "-c", """
import sys

sys.path.insert(0, 'scripts')
from precompute_windshield_crops import PAD, batch
from pass_fixture import load_passes

assert (PAD.roof, PAD.hood, PAD.side) == (0.15, 0.12, 0.06)
passes = load_passes()
ids = ('Cba002-068', 'Cba052-028', 'Cba065-045', 'Cba002-001')
samples = []
for pass_id in ids:
    record = passes[pass_id]
    frame = (record['flag_time'] or record['best_snapshots'][0])['frame']
    samples.append({**record, 'geometry': [
        row for row in record['geometry'] if row[0] == frame
    ]})
unusable = next(record for record in passes.values()
                if record['classification'] == 'Not assessable')
# Exercise a fixture-level rejection and a pass whose only crop fails geometry.
samples.append(unusable)
samples[-2] = {**samples[-2], 'best_snapshots': [],
               'geometry': [[samples[-2]['geometry'][0][0], [0, 0, 20, 20], None]]}
index = batch(samples)
assert index['Cba002-001'] == {'status': 'Not assessable', 'frames': {}}
assert index[unusable['passId']] == {'status': 'Not assessable', 'frames': {}}
"""], cwd=root, check=True)

    index = json.loads((tmp_path / "index.json").read_text())
    for pass_id, frame, time_s in CANDIDATES:
        route = f"/api/passes/{pass_id}/crops"
        metadata = client.get(route, headers=HEADERS).json()
        sample, = metadata["frames"]
        assert sample["time_s"] == time_s
        assert index[pass_id]["frames"][str(frame)].endswith(f"/{pass_id}/{frame}.jpg")
        image = client.get(sample["url"], headers=HEADERS)
        assert image.status_code == 200
        subprocess.run([python, "-c", """
import sys
import cv2
import numpy as np
image = cv2.imdecode(np.frombuffer(sys.stdin.buffer.read(), dtype=np.uint8), cv2.IMREAD_COLOR)
assert image.shape == (192, 384, 3)
assert all(edge.any() for edge in (image[0], image[-1], image[:, 0], image[:, -1]))
"""], input=image.content, check=True)

    assert len(index) == 5
    assert sum(entry["status"] == "Not assessable" for entry in index.values()) == 2
    for pass_id, entry in index.items():
        assert re.fullmatch(r"Cba(?:002|052|065)-[0-9]{3}", pass_id)
        assert set(entry) == {"status", "frames"}
        for frame, relative in entry["frames"].items():
            assert frame.isdecimal()
            assert re.fullmatch(rf"[0-9a-f]{{32}}/{pass_id}/{frame}[.]jpg", relative)
        if entry["status"] == "Not assessable":
            route = f"/api/passes/{pass_id}/crops"
            metadata = client.get(route, headers=HEADERS).json()
            assert metadata["status"] == "Not assessable"
            assert metadata["frames"] == []
            assert client.get(f"{route}/0", headers=HEADERS).status_code == 404
