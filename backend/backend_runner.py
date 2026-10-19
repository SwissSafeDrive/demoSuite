import atexit
from datetime import datetime, timedelta
import os
import signal
import threading
import time

import uvicorn

from database import SessionLocal
from models import Registro
import main


def seed_demo_data():
    main.ensure_schema()
    main.cleanup_temp_captures()

    db = SessionLocal()

    try:
        # Remove transient camera demo rows from previous sessions
        db.query(Registro).filter(Registro.origen == "camara").delete()
        db.commit()

        if db.query(Registro).count() > 0:
            for idx, r in enumerate(db.query(Registro).all(), start=1):
                r.identificatore_demo = f"demo-tech-{idx:03d}"
                r.nota_legal = (
                    "Evento simulato per dimostrazione. "
                    "Non costituisce prova né infrazione reale. "
                    "Privacy by Design — demo non destinata a uso operativo. "
                    "Dati minimizzati nel contesto della dimostrazione."
                )
            db.commit()
            return

        now = datetime.utcnow()

        demo_rows = [
            (
                "demo_lugano_001",
                now - timedelta(minutes=4),
                0.92,
                "Area urbana — Postazione demo A",
                "demo-tech-001",
            ),
            (
                "demo_lugano_002",
                now - timedelta(minutes=13),
                0.87,
                "Area urbana — Postazione demo B",
                "demo-tech-002",
            ),
            (
                "demo_a2_003",
                now - timedelta(minutes=27),
                0.81,
                "Asse principale — Postazione demo C",
                "demo-tech-003",
            ),
            (
                "demo_lugano_004",
                now - timedelta(minutes=41),
                0.76,
                "Area urbana — Postazione demo D",
                "demo-tech-004",
            ),
        ]

        for inf_id, timestamp, confidence, location, demo_id in demo_rows:
            db.add(
                Registro(
                    inf_id=inf_id,
                    timestamp=timestamp,
                    confianza=confidence,
                    ubicacion=location,
                    identificatore_demo=demo_id,
                    estado="pendiente",
                    origen="simulato",
                    nota_legal=(
                        "Evento simulato per dimostrazione. "
                        "Non costituisce prova né infrazione reale. "
                        "Privacy by Design — demo non destinata a uso operativo. "
                        "Dati minimizzati nel contesto della dimostrazione."
                    ),
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
