from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from database import Base


class Registro(Base):
    __tablename__ = "registros"

    id = Column(Integer, primary_key=True, index=True)
    inf_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    confianza = Column(Float)
    ubicacion = Column(String)
    identificatore_demo = Column(String, index=True)
    imagen_path = Column(String, nullable=True)
    estado = Column(String, default="pendiente")
    agente_id = Column(String, nullable=True)
    fecha_decision = Column(DateTime, nullable=True)
    origen = Column(String, default="simulato")  # simulato | camara
    nota_legal = Column(Text, default=(
        "Evento tecnico preliminare. Non costituisce automaticamente prova. "
        "Privacy by Design — demo non destinata a uso operativo. "
        "Dati minimizzati nel contesto della dimostrazione. "
        "Cifratura e politiche di conservazione produttive: POR VALIDAR."
    ))
