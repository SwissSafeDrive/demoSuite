"""Run the demo API on loopback."""

from pathlib import Path
import sys

import uvicorn


def main():
    if not __package__:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

    from backend.config import load_settings

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=int(load_settings().get("SSD_PORT") or "8765"),
        access_log=False,
    )


if __name__ == "__main__":
    main()
