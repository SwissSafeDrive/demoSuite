from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import UTC, datetime
from database import Base


TECHNICAL_NOTICE = (
    "Preliminary technical event. A human operator reviews the evidence and makes the decision. "
    "Privacy by Design — demonstration only. "
    "Data is minimized for the demonstration. "
    "Production encryption and retention policies require validation."
)
SIMULATED_NOTICE = (
    "Simulated event for demonstration. "
    "Privacy by Design. Data is minimized for the demonstration."
)


class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC), index=True)
    confidence = Column(Float)
    location = Column(String)
    demo_id = Column(String, index=True)
    image_path = Column(String, nullable=True)
    state = Column(String, default="pending")
    operator_id = Column(String, nullable=True)
    decision_at = Column(DateTime, nullable=True)
    origin = Column(String, default="simulated")  # simulated | camera
    notice = Column(Text, default=TECHNICAL_NOTICE)
