from typing import Literal

from pydantic import BaseModel, Field


class InjuryCreate(BaseModel):
    user_id: str
    body_part: str
    severity: Literal["mild", "moderate", "severe"]
    description: str = ""


class PainLogCreate(BaseModel):
    injury_id: str
    pain_score: int = Field(ge=1, le=10)
    notes: str = ""