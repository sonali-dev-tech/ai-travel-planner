from typing import List, Optional
from pydantic import BaseModel, Field


class TripPrefs(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    start_date: Optional[str] = None
    days: int = Field(ge=1, le=14)
    budget: float = Field(gt=0)
    currency: str = "INR"
    travelers: int = Field(1, ge=1, le=20)
    travel_style: str = "balanced"
    pace: str = "moderate"
    interests: List[str] = []
    notes: str = Field("", max_length=1000)


class SaveTrip(BaseModel):
    title: Optional[str] = None
    prefs: TripPrefs
    itinerary: dict


class UpdateTrip(BaseModel):
    title: Optional[str] = None
    itinerary: Optional[dict] = None


class RegenerateReq(BaseModel):
    day: Optional[int] = None          # None => poora trip regenerate
    instruction: str = Field("", max_length=500)
    itinerary: Optional[dict] = None   # unsaved edits respect karne ke liye
