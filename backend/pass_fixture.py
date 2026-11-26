import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def load_passes():
    path = Path(__file__).resolve().parent / "fixtures/passes.json"
    records = json.loads(path.read_text(encoding="utf-8"))
    return {record["passId"]: record for record in records}
