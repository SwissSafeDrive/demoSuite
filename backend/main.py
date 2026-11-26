from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import List, Optional
import os
import secrets
import uuid

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session

from clip_routes import create_clip_router
from crop_routes import router as crop_router
from database import Base, engine, get_db
from models import Record, SIMULATED_NOTICE, TECHNICAL_NOTICE
from pass_fixture import load_passes
from schemas import DecisionIn, StatisticsOut, RecordOut


def ensure_schema():
    with engine.begin() as connection:
        # Keep schema creation and the one-time copy in the same SQLite transaction.
        connection.exec_driver_sql("BEGIN IMMEDIATE")
        inspector = inspect(connection)
        if inspector.has_table("records"):
            return
        Base.metadata.create_all(bind=connection)
        if not inspector.has_table("registros"):
            return

        # The older registry may predate the demo identifier.
        columns = {column["name"] for column in inspector.get_columns("registros")}
        legacy_demo_id = "identificatore_demo" if "identificatore_demo" in columns else "NULL"
        connection.execute(text(f"""
            INSERT INTO records (
                id, event_id, timestamp, confidence, location, demo_id, image_path,
                state, operator_id, decision_at, origin, notice
            )
            SELECT id, inf_id, timestamp, confianza,
                replace(replace(replace(ubicacion,
                    'Area urbana — Postazione demo', 'Urban area — Demo station'),
                    'Asse principale — Postazione demo', 'Main road — Demo station'),
                    'Camera locale', 'Local camera'),
                {legacy_demo_id}, imagen_path,
                CASE estado
                    WHEN 'revisado' THEN 'reviewed'
                    WHEN 'confirmado' THEN 'confirmed'
                    WHEN 'descartado' THEN 'discarded'
                    ELSE 'pending'
                END,
                agente_id, fecha_decision,
                CASE origen WHEN 'camara' THEN 'camera' ELSE 'simulated' END,
                CASE origen WHEN 'camara' THEN :technical ELSE :simulated END
            FROM registros
        """), {"technical": TECHNICAL_NOTICE, "simulated": SIMULATED_NOTICE})


ensure_schema()

DATA_DIR = os.environ.get("SSD_DATA_DIR", os.path.dirname(__file__))
CAPTURES_DIR = os.path.join(DATA_DIR, "capturas")
os.makedirs(CAPTURES_DIR, exist_ok=True)

SESSION_TOKEN = os.environ.get("SSD_SESSION_TOKEN") or secrets.token_hex(32)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_STORED_CAPTURES = 10
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def cleanup_temp_captures():
    try:
        if os.path.isdir(CAPTURES_DIR):
            for entry in os.listdir(CAPTURES_DIR):
                full_path = os.path.join(CAPTURES_DIR, entry)
                if os.path.isfile(full_path):
                    os.remove(full_path)
    except OSError:
        pass


@asynccontextmanager
async def lifespan(_app: FastAPI):
    os.makedirs(CAPTURES_DIR, exist_ok=True)
    try:
        yield
    finally:
        cleanup_temp_captures()


app = FastAPI(
    title="SwissSafeDrive API",
    description="API for the phone-use detection demo",
    version="0.2.2",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-SSD-Session", "Range"],
)


def verify_session_token(
    x_ssd_session: Optional[str] = Header(default=None, alias="X-SSD-Session"),
):
    if not x_ssd_session or not secrets.compare_digest(
        x_ssd_session, SESSION_TOKEN
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized session",
        )


app.include_router(create_clip_router(verify_session_token))
app.include_router(crop_router, dependencies=[Depends(verify_session_token)])


def is_valid_image_magic(data: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return len(data) >= 3 and data.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return len(data) >= 8 and data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return (
            len(data) >= 12
            and data[:4] == b"RIFF"
            and data[8:12] == b"WEBP"
        )
    return False


def enforce_capture_retention_limit():
    try:
        files = [
            os.path.join(CAPTURES_DIR, f)
            for f in os.listdir(CAPTURES_DIR)
            if os.path.isfile(os.path.join(CAPTURES_DIR, f))
        ]
        if len(files) > MAX_STORED_CAPTURES:
            files.sort(key=os.path.getmtime)
            for old_file in files[: len(files) - MAX_STORED_CAPTURES]:
                try:
                    os.remove(old_file)
                except OSError:
                    pass
    except OSError:
        pass


@app.get("/")
def root():
    return {
        "service": "SwissSafeDrive",
        "version": "0.2.2",
        "status": "active",
        "notice": (
            "Privacy by Design — demonstration only. "
            "Data is minimized for the demonstration."
        ),
    }


@app.get(
    "/api/records",
    response_model=List[RecordOut],
    dependencies=[Depends(verify_session_token)],
)
def list_records(db: Session = Depends(get_db)):
    return db.query(Record).order_by(Record.timestamp.desc()).all()


@app.get(
    "/api/records/{record_id}",
    response_model=RecordOut,
    dependencies=[Depends(verify_session_token)],
)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record non trovato")
    return record


@app.patch(
    "/api/records/{record_id}/decision",
    response_model=RecordOut,
    dependencies=[Depends(verify_session_token)],
)
def submit_decision(
    record_id: int,
    decision: DecisionIn,
    db: Session = Depends(get_db),
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record non trovato")

    valid_states = ["pending", "reviewed", "confirmed", "discarded"]
    if decision.state not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state. Use: {valid_states}",
        )

    record.state = decision.state
    record.operator_id = decision.operator_id
    record.decision_at = datetime.now(UTC)
    db.commit()
    db.refresh(record)
    return record


@app.get(
    "/api/statistics",
    response_model=StatisticsOut,
    dependencies=[Depends(verify_session_token)],
)
def statistics(db: Session = Depends(get_db)):
    total = db.query(func.count(Record.id)).scalar() or 0
    pending = (
        db.query(func.count(Record.id))
        .filter(Record.state == "pending")
        .scalar()
        or 0
    )
    reviewed = (
        db.query(func.count(Record.id))
        .filter(Record.state == "reviewed")
        .scalar()
        or 0
    )
    confirmed = (
        db.query(func.count(Record.id))
        .filter(Record.state == "confirmed")
        .scalar()
        or 0
    )
    discarded = (
        db.query(func.count(Record.id))
        .filter(Record.state == "discarded")
        .scalar()
        or 0
    )
    average = db.query(func.avg(Record.confidence)).scalar() or 0.0

    return StatisticsOut(
        total=total,
        pending=pending,
        reviewed=reviewed,
        confirmed=confirmed,
        discarded=discarded,
        average_confidence=round(float(average), 3),
    )


@app.post(
    "/api/captures/upload",
    response_model=RecordOut,
    dependencies=[Depends(verify_session_token)],
)
async def upload_capture(
    file: UploadFile = File(...),
    location: str = Form("Local camera"),
    confidence: float = Form(0.75),
    db: Session = Depends(get_db),
):
    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. Use JPEG, PNG or WebP.",
        )

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the 5 MB limit",
        )
    if not is_valid_image_magic(contents, content_type):
        raise HTTPException(
            status_code=415,
            detail="File contents do not match the declared image type",
        )

    uid_short = uuid.uuid4().hex[:6]
    event_id = f"inf_cam_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}_{uid_short}"
    ext = ALLOWED_CONTENT_TYPES[content_type]
    filename = f"{event_id}{ext}"
    filepath = os.path.join(CAPTURES_DIR, filename)

    os.makedirs(CAPTURES_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    enforce_capture_retention_limit()

    demo_id = f"demo-tech-{uid_short}"

    record = Record(
        event_id=event_id,
        timestamp=datetime.now(UTC),
        confidence=max(0.0, min(1.0, float(confidence))),
        location=(location or "Local camera")[:120],
        demo_id=demo_id,
        image_path=filename,
        state="pending",
        origin="camera",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get(
    "/api/images/{record_id}",
    dependencies=[Depends(verify_session_token)],
)
def get_image(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record or not record.image_path:
        raise HTTPException(status_code=404, detail="Image not found")

    safe_name = os.path.basename(record.image_path)
    filepath = os.path.join(CAPTURES_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image file missing")

    return FileResponse(filepath, media_type="image/jpeg")


@app.get("/api/passes", dependencies=[Depends(verify_session_token)])
def list_passes(clip: str | None = None, track_id: int | None = None):
    return [
        record for record in load_passes().values()
        if (clip is None or record["clip"]["id"] == clip)
        and (track_id is None or track_id in record["track_ids"])
    ]


@app.get("/api/passes/{pass_id}", dependencies=[Depends(verify_session_token)])
def get_pass(pass_id: str):
    record = load_passes().get(pass_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Pass not found")
    return record
