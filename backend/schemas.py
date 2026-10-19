from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RegistroBase(BaseModel):
    inf_id: str
    timestamp: datetime
    confianza: float
    ubicacion: str
    identificatore_demo: Optional[str] = None
    estado: str
    origen: str = "simulato"
    nota_legal: str


class RegistroOut(RegistroBase):
    id: int
    imagen_path: Optional[str] = None
    agente_id: Optional[str] = None
    fecha_decision: Optional[datetime] = None

    class Config:
        from_attributes = True


class DecisionIn(BaseModel):
    estado: str
    agente_id: Optional[str] = "agente_demo"


class EstadisticasOut(BaseModel):
    total: int
    pendientes: int
    revisados: int
    confirmados: int
    descartados: int
    confianza_media: float
