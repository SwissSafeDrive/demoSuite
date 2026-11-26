from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class RecordBase(BaseModel):
    event_id: str
    timestamp: datetime
    confidence: float
    location: str
    demo_id: Optional[str] = None
    state: str
    origin: str = "simulated"
    notice: str


class RecordOut(RecordBase):
    id: int
    image_path: Optional[str] = None
    operator_id: Optional[str] = None
    decision_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DecisionIn(BaseModel):
    state: str
    operator_id: Optional[str] = "demo_operator"


class StatisticsOut(BaseModel):
    total: int
    pending: int
    reviewed: int
    confirmed: int
    discarded: int
    average_confidence: float


class ManualFlagIn(BaseModel):
    flagged_manually: bool
