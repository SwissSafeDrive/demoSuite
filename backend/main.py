from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
import os
import secrets
import shutil
import uuid

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func, inspect
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Registro
from schemas import DecisionIn, EstadisticasOut, RegistroOut


def ensure_schema():
    inspector = inspect(engine)
    if inspector.has_table("registros"):
        cols = {c["name"] for c in inspector.get_columns("registros")}
        if "identificatore_demo" not in cols:
            Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


ensure_schema()

DATA_DIR = os.environ.get("SSD_DATA_DIR", os.path.dirname(__file__))
CAPTURAS_DIR = os.path.join(DATA_DIR, "capturas")
os.makedirs(CAPTURAS_DIR, exist_ok=True)

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
        if os.path.isdir(CAPTURAS_DIR):
            for entry in os.listdir(CAPTURAS_DIR):
                full_path = os.path.join(CAPTURAS_DIR, entry)
                if os.path.isfile(full_path):
                    os.remove(full_path)
    except OSError:
        pass


@asynccontextmanager
async def lifespan(_app: FastAPI):
    os.makedirs(CAPTURAS_DIR, exist_ok=True)
    try:
        yield
    finally:
        cleanup_temp_captures()


app = FastAPI(
    title="SwissSafeDrive API",
    description="API per il sistema dimostrativo di rilevamento uso telefono alla guida",
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
    allow_headers=["Content-Type", "X-SSD-Session"],
)


def verify_session_token(
    x_ssd_session: Optional[str] = Header(default=None, alias="X-SSD-Session"),
):
    if not x_ssd_session or not secrets.compare_digest(
        x_ssd_session, SESSION_TOKEN
    ):
        raise HTTPException(
            status_code=401,
            detail="Sessione non autorizzata",
        )


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
            os.path.join(CAPTURAS_DIR, f)
            for f in os.listdir(CAPTURAS_DIR)
            if os.path.isfile(os.path.join(CAPTURAS_DIR, f))
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
        "servizio": "SwissSafeDrive",
        "versione": "0.2.2",
        "stato": "attivo",
        "avviso": (
            "Privacy by Design — demo non destinata a uso operativo. "
            "Dati minimizzati nel contesto della dimostrazione."
        ),
    }


@app.get(
    "/api/registros",
    response_model=List[RegistroOut],
    dependencies=[Depends(verify_session_token)],
)
def listar_registros(db: Session = Depends(get_db)):
    return db.query(Registro).order_by(Registro.timestamp.desc()).all()


@app.get(
    "/api/registros/{registro_id}",
    response_model=RegistroOut,
    dependencies=[Depends(verify_session_token)],
)
def obtener_registro(registro_id: int, db: Session = Depends(get_db)):
    reg = db.query(Registro).filter(Registro.id == registro_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro non trovato")
    return reg


@app.patch(
    "/api/registros/{registro_id}/decision",
    response_model=RegistroOut,
    dependencies=[Depends(verify_session_token)],
)
def tomar_decision(
    registro_id: int,
    decision: DecisionIn,
    db: Session = Depends(get_db),
):
    reg = db.query(Registro).filter(Registro.id == registro_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro non trovato")

    estados_validos = ["pendiente", "revisado", "confirmado", "descartado"]
    if decision.estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Stato non valido. Usa: {estados_validos}",
        )

    reg.estado = decision.estado
    reg.agente_id = decision.agente_id
    reg.fecha_decision = datetime.utcnow()
    db.commit()
    db.refresh(reg)
    return reg


@app.get(
    "/api/estadisticas",
    response_model=EstadisticasOut,
    dependencies=[Depends(verify_session_token)],
)
def estadisticas(db: Session = Depends(get_db)):
    total = db.query(func.count(Registro.id)).scalar() or 0
    pendientes = (
        db.query(func.count(Registro.id))
        .filter(Registro.estado == "pendiente")
        .scalar()
        or 0
    )
    revisados = (
        db.query(func.count(Registro.id))
        .filter(Registro.estado == "revisado")
        .scalar()
        or 0
    )
    confirmados = (
        db.query(func.count(Registro.id))
        .filter(Registro.estado == "confirmado")
        .scalar()
        or 0
    )
    descartados = (
        db.query(func.count(Registro.id))
        .filter(Registro.estado == "descartado")
        .scalar()
        or 0
    )
    media = db.query(func.avg(Registro.confianza)).scalar() or 0.0

    return EstadisticasOut(
        total=total,
        pendientes=pendientes,
        revisados=revisados,
        confirmados=confirmados,
        descartados=descartados,
        confianza_media=round(float(media), 3),
    )


@app.post(
    "/api/capturas/upload",
    response_model=RegistroOut,
    dependencies=[Depends(verify_session_token)],
)
async def subir_captura(
    file: UploadFile = File(...),
    ubicacion: str = Form("Camera locale"),
    confianza: float = Form(0.75),
    db: Session = Depends(get_db),
):
    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Formato file non supportato. Usa JPEG, PNG o WebP.",
        )

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="File vuoto")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File troppo grande (limite massimo 5 MB)",
        )
    if not is_valid_image_magic(contents, content_type):
        raise HTTPException(
            status_code=415,
            detail="Contenuto file non valido per il tipo di immagine dichiarato",
        )

    uid_short = uuid.uuid4().hex[:6]
    inf_id = f"inf_cam_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uid_short}"
    ext = ALLOWED_CONTENT_TYPES[content_type]
    filename = f"{inf_id}{ext}"
    filepath = os.path.join(CAPTURAS_DIR, filename)

    os.makedirs(CAPTURAS_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    enforce_capture_retention_limit()

    identificatore_demo = f"demo-tech-{uid_short}"

    reg = Registro(
        inf_id=inf_id,
        timestamp=datetime.utcnow(),
        confianza=max(0.0, min(1.0, float(confianza))),
        ubicacion=(ubicacion or "Camera locale")[:120],
        identificatore_demo=identificatore_demo,
        imagen_path=filename,
        estado="pendiente",
        origen="camara",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@app.get(
    "/api/imagenes/{registro_id}",
    dependencies=[Depends(verify_session_token)],
)
def obtener_imagen(registro_id: int, db: Session = Depends(get_db)):
    reg = db.query(Registro).filter(Registro.id == registro_id).first()
    if not reg or not reg.imagen_path:
        raise HTTPException(status_code=404, detail="Immagine non trovata")

    safe_name = os.path.basename(reg.imagen_path)
    filepath = os.path.join(CAPTURAS_DIR, safe_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File immagine mancante")

    return FileResponse(filepath, media_type="image/jpeg")
