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
    Format: "Day N [theme]: time Place A (place_id); time Place B (place_id)"
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
        if pid:
            parts.append(f" {tw} {name} (place_id: {pid})")
        else:
            parts.append(f" {tw} {name}")
    return " ".join(parts).strip()


def compress_itinerary(itinerary: list[dict[str, Any]], max_tokens_approx: int = 300) -> str:
    """
    Compress full itinerary into a single string for the agent (~200–300 tokens).
    Includes day_number, theme, and per activity: time_window, place_name, place_id.
    """
    day_lines = []
    for day in sorted(itinerary, key=lambda d: d.get("day_number", d.get("day", 0))):
        day_lines.append(compress_day_summary(day))

    out = " | ".join(day_lines)

    # Rough token cap: ~4 chars per token. If over, truncate by shortening later days.
    if max_tokens_approx and len(out) > max_tokens_approx * 4:
        # Prefer keeping early days; shorten from the end
        out = out[: max_tokens_approx * 4].rsplit(" | ", 1)[0] + " | ..."
    return out
