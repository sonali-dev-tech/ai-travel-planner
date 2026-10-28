import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from . import ai  # noqa: E402
from .auth import current_user  # noqa: E402
from .db import supabase  # noqa: E402
from .schemas import RegenerateReq, SaveTrip, TripPrefs, UpdateTrip  # noqa: E402

app = FastAPI(title="Personalized Travel Itinerary Planner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

LIST_COLS = "id,title,destination,days,budget,currency,travel_style,start_date,created_at,updated_at"


def _get_trip(trip_id: str, uid: str) -> dict:
    rows = supabase.table("trips").select("*").eq("id", trip_id).eq("user_id", uid).limit(1).execute().data
    if not rows:
        raise HTTPException(404, "Trip not found")
    return rows[0]


@app.get("/api/health")
def health():
    return {"status": "ok", "mock_ai": ai._use_mock()}


@app.post("/api/trips/generate")
def generate(prefs: TripPrefs, uid: str = Depends(current_user)):
    """Itinerary generate karta hai (save nahi karta) - preview ke liye."""
    try:
        return {"itinerary": ai.generate_itinerary(prefs)}
    except Exception as e:
        raise HTTPException(502, f"AI generation failed: {e}")


@app.post("/api/trips", status_code=201)
def save_trip(body: SaveTrip, uid: str = Depends(current_user)):
    p = body.prefs
    row = {
        "user_id": uid,
        "title": body.title or f"{p.days}-day trip to {p.destination}",
        "destination": p.destination, "start_date": p.start_date or None,
        "days": p.days, "budget": p.budget, "currency": p.currency,
        "travel_style": p.travel_style, "prefs": p.model_dump(), "itinerary": body.itinerary,
    }
    return supabase.table("trips").insert(row).execute().data[0]


@app.get("/api/trips")
def list_trips(uid: str = Depends(current_user)):
    return supabase.table("trips").select(LIST_COLS).eq("user_id", uid).order("created_at", desc=True).execute().data


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str, uid: str = Depends(current_user)):
    return _get_trip(trip_id, uid)


@app.put("/api/trips/{trip_id}")
def update_trip(trip_id: str, body: UpdateTrip, uid: str = Depends(current_user)):
    _get_trip(trip_id, uid)
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    patch["updated_at"] = datetime.now(timezone.utc).isoformat()
    return supabase.table("trips").update(patch).eq("id", trip_id).eq("user_id", uid).execute().data[0]


@app.delete("/api/trips/{trip_id}", status_code=204)
def delete_trip(trip_id: str, uid: str = Depends(current_user)):
    _get_trip(trip_id, uid)
    supabase.table("trips").delete().eq("id", trip_id).eq("user_id", uid).execute()


@app.post("/api/trips/{trip_id}/regenerate")
def regenerate(trip_id: str, body: RegenerateReq, uid: str = Depends(current_user)):
    trip = _get_trip(trip_id, uid)
    prefs = TripPrefs(**trip["prefs"])
    current = body.itinerary or trip["itinerary"]
    if body.day and not (1 <= body.day <= len(current.get("days", []))):
        raise HTTPException(400, "Invalid day")
    try:
        new_it = ai.regenerate(prefs, current, body.day, body.instruction)
    except Exception as e:
        raise HTTPException(502, f"AI regeneration failed: {e}")
    row = supabase.table("trips").update({
        "itinerary": new_it, "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", trip_id).eq("user_id", uid).execute().data[0]
    return row
