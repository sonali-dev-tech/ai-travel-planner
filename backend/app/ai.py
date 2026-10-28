"""Generative AI layer: prompt engineering + JSON validation."""
import json
import os
import re
from typing import Optional

from .schemas import TripPrefs

MODEL = os.getenv("AI_MODEL", "claude-sonnet-5-5")

SYSTEM = """You are an expert travel planner with deep local knowledge.
Return ONE valid JSON object and nothing else (no markdown fences, no commentary).

Planning rules:
1. Stay within the traveler's total budget (all travelers combined). Use realistic local prices in the given currency.
2. Cluster activities geographically per day to minimise transit time; order them logically by time.
3. Pace: relaxed = 3 activities/day, moderate = 4-5, packed = 6-7 (meals and transport legs count).
4. Every day must include breakfast, lunch and dinner as type "dining" with a specific, real-sounding place or cuisine.
5. Include "transport" items for non-trivial moves (metro, taxi, train) with cost.
6. Match the travel style (budget/balanced/luxury/adventure/cultural/relaxation) and the listed interests.
7. activity.type must be one of: attraction | dining | transport | accommodation. time is 24h "HH:MM". cost is a number (total for the group, 0 if free).
8. Add 3-5 short practical tips (safety, best time, booking, local customs)."""

SCHEMA = """{
 "summary": "2-3 sentence overview",
 "currency": "INR",
 "total_estimated_cost": 0,
 "accommodation": {"name": "", "area": "", "type": "", "price_per_night": 0, "why": ""},
 "transportation": {"to_destination": "", "local": "", "estimated_cost": 0},
 "days": [{"day": 1, "title": "", "theme": "", "estimated_cost": 0,
   "activities": [{"time": "09:00", "type": "attraction", "title": "", "description": "", "location": "", "duration": "2h", "cost": 0}]}],
 "tips": [""]
}"""


def _prefs_block(p: TripPrefs) -> str:
    return (
        f"Destination: {p.destination}\nDuration: {p.days} days (start: {p.start_date or 'flexible'})\n"
        f"Total budget: {p.budget} {p.currency}\nTravelers: {p.travelers}\n"
        f"Travel style: {p.travel_style}\nPace: {p.pace}\n"
        f"Interests: {', '.join(p.interests) or 'general sightseeing'}\n"
        f"Special notes: {p.notes or 'none'}"
    )


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("AI did not return JSON")
    return json.loads(text[start : end + 1])


def _call(prompt: str) -> dict:
    from anthropic import Anthropic

    client = Anthropic()  # ANTHROPIC_API_KEY env se
    last_err = None
    for _ in range(2):  # ek retry agar JSON invalid ho
        resp = client.messages.create(
            model=MODEL, max_tokens=8000, system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return _extract_json(resp.content[0].text)
        except Exception as e:  # noqa
            last_err = e
    raise RuntimeError(f"AI response parse failed: {last_err}")


def _mock(p: TripPrefs) -> dict:
    days = []
    for d in range(1, p.days + 1):
        days.append({
            "day": d, "title": f"Day {d} in {p.destination}", "theme": "Highlights",
            "estimated_cost": 0,
            "activities": [
                {"time": "08:30", "type": "dining", "title": "Local breakfast café", "description": "Regional breakfast.", "location": p.destination, "duration": "1h", "cost": round(p.budget * 0.01)},
                {"time": "10:00", "type": "attraction", "title": f"Top landmark #{d}", "description": "Guided visit of a must-see spot.", "location": p.destination, "duration": "3h", "cost": round(p.budget * 0.03)},
                {"time": "13:30", "type": "dining", "title": "Street-food lunch", "description": "Popular local eatery.", "location": p.destination, "duration": "1h", "cost": round(p.budget * 0.015)},
                {"time": "15:00", "type": "transport", "title": "Cab to old town", "description": "Short ride.", "location": p.destination, "duration": "30m", "cost": round(p.budget * 0.01)},
                {"time": "19:30", "type": "dining", "title": "Signature dinner", "description": "Local specialties.", "location": p.destination, "duration": "2h", "cost": round(p.budget * 0.025)},
            ],
        })
    return {
        "summary": f"(MOCK) Demo itinerary for {p.destination}. Real AI key set karein.",
        "currency": p.currency, "total_estimated_cost": 0,
        "accommodation": {"name": "Central Boutique Stay", "area": "City centre", "type": "Hotel", "price_per_night": round(p.budget * 0.08), "why": "Close to everything."},
        "transportation": {"to_destination": "Flight/train as per origin", "local": "Metro + cabs", "estimated_cost": round(p.budget * 0.15)},
        "days": days, "tips": ["Book popular spots early", "Carry cash for street food"],
    }


def _use_mock() -> bool:
    return os.getenv("MOCK_AI", "false").lower() == "true" or not os.getenv("ANTHROPIC_API_KEY")


def _normalize(it: dict) -> dict:
    it.setdefault("days", [])
    for i, d in enumerate(it["days"], 1):
        d["day"] = i
        d.setdefault("activities", [])
        d["estimated_cost"] = sum(float(a.get("cost") or 0) for a in d["activities"])
    return it


def generate_itinerary(p: TripPrefs) -> dict:
    if _use_mock():
        return _normalize(_mock(p))
    prompt = f"Create a day-by-day itinerary.\n\n{_prefs_block(p)}\n\nReturn JSON matching exactly this schema:\n{SCHEMA}"
    return _normalize(_call(prompt))


def regenerate(p: TripPrefs, current: dict, day: Optional[int], instruction: str) -> dict:
    if _use_mock():
        fresh = _mock(p)
        if day:
            current["days"][day - 1] = fresh["days"][min(day, len(fresh["days"])) - 1]
            return _normalize(current)
        return _normalize(fresh)

    extra = f"User instruction: {instruction}" if instruction else "Give a fresh alternative with different places."
    if day:
        prompt = (
            f"{_prefs_block(p)}\n\nCurrent itinerary:\n{json.dumps(current)}\n\n"
            f"Regenerate ONLY day {day}. Keep it consistent with the other days (no repeated places). {extra}\n"
            'Return ONE JSON object: a single day with keys day, title, theme, estimated_cost, activities (same activity schema).'
        )
        new_day = _call(prompt)
        current["days"][day - 1] = new_day
        return _normalize(current)

    prompt = (
        f"{_prefs_block(p)}\n\nPrevious itinerary (for reference):\n{json.dumps(current)}\n\n"
        f"Regenerate the ENTIRE itinerary. {extra}\nReturn JSON matching exactly this schema:\n{SCHEMA}"
    )
    return _normalize(_call(prompt))
