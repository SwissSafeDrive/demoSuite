import json
import subprocess
from pathlib import Path

import pytest


APP = Path(__file__).resolve().parents[2] / "app"


@pytest.mark.parametrize(("pass_id", "start_frame", "start_time", "end_time", "duration"), [
    ("Cba002-068", 1190, 47.60, 48.28, 0.72),
    ("Cba052-028", 906, 36.24, 37.36, 1.16),
    ("Cba065-045", 1032, 41.28, 42.08, 0.84),
])
def test_phone_stretch_seeks_to_its_first_frame(client, pass_id, start_frame, start_time, end_time, duration):
    response = client.get(f"/api/passes/{pass_id}", headers={"X-SSD-Session": "test-session"})
    response.raise_for_status()
    result = subprocess.run(
        ["node", "--input-type=module", "-e", """
            import { readFileSync } from 'node:fs';
            import { behaviourStretches } from './src/media/passAnalysis.js';
            const pass = JSON.parse(readFileSync(0, 'utf8'));
            console.log(JSON.stringify(behaviourStretches(pass)[0]));
        """],
        cwd=APP, input=response.text, text=True, capture_output=True, check=True,
    )
    assert json.loads(result.stdout) == {
        "name": "Phone in hand",
        "seekFrame": start_frame,
        "endFrame": round(end_time * 25),
        "startTime": start_time,
        "endTime": end_time,
        "duration": duration,
        "label": "SIMULATED SIGNAL",
    }
