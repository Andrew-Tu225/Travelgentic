"""
Chatbot context helpers: trip header and compressed itinerary for agent prompts.
"""
import json
from typing import Any


def build_trip_header(trip: dict[str, Any]) -> str:
    """
    Build a short JSON trip header for the agent (basic trip info + onboarding-style fields).
    Kept to ~100–150 tokens. Uses trip dict as returned from get_trip_details (or similar).
    """
    header = {
        "destination": trip.get("destination"),
        "origin": trip.get("origin"),
        "month": trip.get("month"),
        "start_date": trip.get("start_date"),
        "duration_days": trip.get("duration_days"),
        "budget": trip.get("budget"),
        "trip_vibe": trip.get("trip_vibe"),
    }
    # Drop None values to keep it short
    header = {k: v for k, v in header.items() if v is not None}
    return json.dumps(header, indent=None)


def compress_day_summary(day: dict[str, Any]) -> str:
    """
    Compress a single day for prompts (e.g. add_activity target day).
    Format: "Day N [theme]: time Place A (place_id, category); ..."
    Includes all activities. No descriptions — use get_place_details for intro/describe questions.
    """
    num = day.get("day_number", day.get("day", "?"))
    theme = day.get("theme") or ""
    parts = [f"Day {num}"]
    if theme:
        parts.append(f"[{theme}]")
    parts.append(":")
    for a in day.get("activities", []):
        tw = a.get("time_window") or "?"
        name = a.get("place_name") or "?"
        pid = a.get("place_id")
        cat = a.get("category_tag")
        cat_str = f", {cat}" if cat else ""
        if pid:
            parts.append(f" {tw} {name} (place_id: {pid}{cat_str})")
        else:
            parts.append(f" {tw} {name}{cat_str}")
    return " ".join(parts).strip()


def compress_itinerary(itinerary: list[dict[str, Any]]) -> str:
    """
    Compress full itinerary into a single string for the agent.
    Includes ALL days and ALL activities — no truncation.
    Per activity: time_window, place_name, place_id, category_tag (no description).
    For intro/describe questions, the model should call get_place_details to fetch
    editorial_summary etc. — more token efficient than embedding descriptions in every request.
    """
    day_lines = []
    for day in sorted(itinerary, key=lambda d: d.get("day_number", d.get("day", 0))):
        day_lines.append(compress_day_summary(day))
    return " | ".join(day_lines)
