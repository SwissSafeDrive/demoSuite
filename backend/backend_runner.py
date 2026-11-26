import atexit
from datetime import UTC, datetime, timedelta
import os
import signal
import threading
import time

import uvicorn

from database import SessionLocal
from models import Record, SIMULATED_NOTICE
import main


def seed_demo_data():
    main.cleanup_temp_captures()

    db = SessionLocal()

    try:
        # Remove transient camera demo rows from previous sessions
        db.query(Record).filter(Record.origin == "camera").delete()
        db.commit()

        if db.query(Record).count() > 0:
            return

        now = datetime.now(UTC)

        demo_rows = [
            (
                "demo_lugano_001",
                now - timedelta(minutes=4),
                0.92,
                "Urban area — Demo station A",
                "demo-tech-001",
            ),
            (
                "demo_lugano_002",
                now - timedelta(minutes=13),
                0.87,
                "Urban area — Demo station B",
                "demo-tech-002",
            ),
            (
                "demo_a2_003",
                now - timedelta(minutes=27),
                0.81,
                "Main road — Demo station C",
                "demo-tech-003",
            ),
            (
                "demo_lugano_004",
                now - timedelta(minutes=41),
                0.76,
                "Urban area — Demo station D",
                "demo-tech-004",
            ),
        ]

        for event_id, timestamp, confidence, location, demo_id in demo_rows:
            db.add(
                Record(
                    event_id=event_id,
                    timestamp=timestamp,
                    confidence=confidence,
                    location=location,
                    demo_id=demo_id,
                    state="pending",
                    origin="simulated",
                    notice=SIMULATED_NOTICE,
                )
            )

        db.commit()

    finally:
        db.close()


def watch_parent_process(parent_pid: int):
    while True:
        time.sleep(1.0)
        try:
            os.kill(parent_pid, 0)
        except OSError:
            main.cleanup_temp_captures()
            os.kill(os.getpid(), signal.SIGTERM)
            break


if __name__ == "__main__":
    atexit.register(main.cleanup_temp_captures)
    seed_demo_data()

    parent_pid_str = os.environ.get("SSD_PARENT_PID", "").strip()
    if parent_pid_str.isdigit():
        parent_pid = int(parent_pid_str)
        if parent_pid > 1:
            watcher = threading.Thread(
                target=watch_parent_process,
                args=(parent_pid,),
                daemon=True,
            )
            watcher.start()

    port = int(os.environ.get("SSD_PORT", "8765"))

    uvicorn.run(
        main.app,
        host="127.0.0.1",
        port=port,
        log_level="warning",
        access_log=False,
    )
