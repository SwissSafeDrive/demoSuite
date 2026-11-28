from datetime import datetime
from typing import Literal

from pydantic import BaseModel, StrictBool

ReviewState = Literal["pending", "reviewed", "confirmed", "discarded"]


class ManualFlagIn(BaseModel):
    flagged_manually: StrictBool


class DecisionIn(BaseModel):
    state: ReviewState
    operator_id: str | None = None


class DecisionOut(DecisionIn):
    passId: str
    decision_at: datetime | None = None
