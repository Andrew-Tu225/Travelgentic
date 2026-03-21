"""
Chatbot agent tools: declarations for the LLM and executor that runs search_places,
get_place_details, and update_itinerary. Used by the agent runner.
"""
import copy
import json
import logging
from typing import Any
import re

from app.services.places_service import search_places as _search_places
from app.services.places_service import get_place_details as _get_place_details

logger = logging.getLogger(__name__)


# ─── Tool declarations (Gemini / OpenAPI-style) ──────────────────────────────

SEARCH_PLACES_DECLARATION = {
    "name": "search_places",
    "description": "Search for places using a natural language query. Include location in the query when possible (e.g. 'coffee shops in Lisbon', 'museums in Paris'). Use this to find places to add to the itinerary.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language search (e.g. 'Thai restaurant Sydney', 'cafes in Lisbon')",
            },
            "location": {
                "type": "string",
                "description": "Optional. Latitude,longitude as 'lat,lng' to bias results. Prefer putting location in query if you only have a city name.",
            },
            "radius": {
                "type": "integer",
                "description": "Optional. Radius in meters to bias results; max 50000.",
            },
        },
        "required": ["query"],
    },
}

GET_PLACE_DETAILS_DECLARATION = {
    "name": "get_place_details",
    "description": "Get detailed information (name, address, rating, editorial_summary, opening_hours) about a place by its Google Place ID. Use when: (1) user asks to introduce/describe places — call for each place to get rich descriptions; (2) after search_places when you need more info before adding; (3) user has questions about a specific place.",
    "parameters": {
        "type": "object",
        "properties": {
            "place_id": {
                "type": "string",
                "description": "Google Place ID from a search_places result or from the itinerary.",
            },
        },
        "required": ["place_id"],
    },
}

UPDATE_ITINERARY_DECLARATION = {
    "name": "update_itinerary",
    "description": "Make changes to the itinerary: add a new activity, remove an existing one, or modify fields on an existing one (time_window, description, etc). Always confirm what you changed in your response.",
    "parameters": {
        "type": "object",
        "properties": {
            "operation": {
                "type": "string",
                "enum": ["add", "remove", "modify"],
                "description": "Whether to add, remove, or modify an activity.",
            },
            "day": {
                "type": "integer",
                "description": "Which day number to change (1-based).",
            },
            "place_id": {
                "type": "string",
                "description": "Required for add (from search_places result) and for remove/modify (from existing itinerary).",
            },
            "fields": {
                "type": "object",
                "description": "For modify: only fields being changed. For add: place_name (required), time_window, description, estimated_cost_usd (one of: free, $1-20, $20-60, $60+), category_tag (one of: food, nature, culture, nightlife, adventure, wellness).",
            },
        },
        "required": ["operation", "day", "place_id"],
    },
}

TOOL_DECLARATIONS = [
    SEARCH_PLACES_DECLARATION,
    GET_PLACE_DETAILS_DECLARATION,
    UPDATE_ITINERARY_DECLARATION,
]


# ─── update_itinerary logic (pure, takes/returns itinerary list) ─────────────

_TIME_WINDOW_RE = re.compile(r"(?P<h>\d{1,2}):(?P<m>\d{2})")


def _time_window_start_minutes(time_window: str | None) -> int | None:
    """
    Extract start time (HH:MM) from a time_window like '09:00–11:00' or '9:00-11:00'.
    Returns minutes from midnight, or None if not parseable.
    """
    if not time_window:
        return None
    m = _TIME_WINDOW_RE.search(time_window)
    if not m:
        return None
    try:
        h = int(m.group("h"))
        mm = int(m.group("m"))
    except Exception:
        return None
    if not (0 <= h <= 23 and 0 <= mm <= 59):
        return None
    return h * 60 + mm


def _sort_activities_by_time(activities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Sort activities by start time if available; keep relative order for those without time_window.
    """
    with_idx = []
    without_idx = []
    for i, a in enumerate(activities):
        start = _time_window_start_minutes(a.get("time_window"))
        if start is None:
            without_idx.append((i, a))
        else:
            with_idx.append((start, i, a))
    with_idx.sort(key=lambda t: (t[0], t[1]))
    # Put unknown times at the end, preserving original order among them.
    return [t[2] for t in with_idx] + [t[1] for t in without_idx]


def _apply_update_itinerary(
    operation: str,
    day: int,
    place_id: str,
    fields: dict[str, Any] | None,
    current_itinerary: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], str]:
    """
    Apply one update to a copy of the itinerary. Returns (updated_itinerary, confirmation_message).
    """
    itinerary = copy.deepcopy(current_itinerary)
    day_obj = next(
        (d for d in itinerary if d.get("day_number", d.get("day")) == day),
        None,
    )
    if not day_obj:
        return current_itinerary, f"Error: Day {day} not found in itinerary."

    activities = day_obj.get("activities") or []

    if operation == "remove":
        new_activities = [a for a in activities if a.get("place_id") != place_id]
        if len(new_activities) == len(activities):
            return current_itinerary, f"Error: No activity with place_id {place_id} on day {day}."
        day_obj["activities"] = new_activities
        return itinerary, f"Removed activity (place_id {place_id}) from Day {day}."

    if operation == "modify":
        if not fields:
            return current_itinerary, "Error: 'fields' required for modify."
        for a in activities:
            if a.get("place_id") == place_id:
                for k, v in fields.items():
                    if k in ("place_name", "time_window", "description", "estimated_cost_usd", "category_tag", "theme"):
                        a[k] = v
                return itinerary, f"Updated activity on Day {day} (place_id {place_id})."
        return current_itinerary, f"Error: No activity with place_id {place_id} on day {day}."

    if operation == "add":
        # fields: place_name or name (from search), plus optional time_window, description, etc.
        f = fields or {}
        place_name = f.get("place_name") or f.get("name") or "Unknown place"
        new_activity = {
            "place_id": place_id,
            "place_name": place_name,
            "time_window": f.get("time_window"),
            "description": f.get("description"),
            "estimated_cost_usd": f.get("estimated_cost_usd"),
            "category_tag": f.get("category_tag"),
        }
        day_obj["activities"] = _sort_activities_by_time(activities + [new_activity])
        return itinerary, f"Added {place_name} (place_id {place_id}) to Day {day}."

    return current_itinerary, f"Error: Unknown operation '{operation}'."


# ─── Tool executor ─────────────────────────────────────────────────────────

async def execute_tool(
    name: str,
    args: dict[str, Any],
    *,
    current_itinerary: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Execute one tool by name with the given args. Returns a result dict for the LLM.

    For search_places and get_place_details, returns { "result": "<text summary or JSON>" }.
    For update_itinerary, returns { "result": "<confirmation>", "updated_itinerary": [...] }
    so the runner can refresh state. current_itinerary is required when name == "update_itinerary".
    """
    if name == "search_places":
        query = args.get("query") or ""
        location = args.get("location")
        radius = args.get("radius")
        data = await _search_places(query=query, location=location, radius=radius)
        if data.get("status") == "OK" and data.get("results"):
            # Summarize for the model: name, place_id, rating, types
            summary = []
            for p in data["results"][:5]:
                summary.append({
                    "name": p.get("name"),
                    "place_id": p.get("place_id"),
                    "rating": p.get("rating"),
                    "types": p.get("types", [])[:5],
                })
            return {"result": json.dumps(summary, indent=None)}
        if data.get("status") == "ZERO_RESULTS":
            return {"result": "No places found for that query."}
        return {"result": json.dumps({"error": data.get("error", data.get("status", "Unknown error"))})}

    if name == "get_place_details":
        place_id = args.get("place_id") or ""
        data = await _get_place_details(place_id)
        if data.get("status") == "OK" and data.get("result"):
            r = data["result"]
            return {
                "result": json.dumps({
                    "name": r.get("name"),
                    "place_id": place_id,
                    "formatted_address": r.get("formatted_address"),
                    "rating": r.get("rating"),
                    "user_ratings_total": r.get("user_ratings_total"),
                    "types": r.get("types", [])[:8],
                    "opening_hours": r.get("opening_hours"),
                    "editorial_summary": r.get("editorial_summary", {}).get("overview") if isinstance(r.get("editorial_summary"), dict) else None,
                }, indent=None)
            }
        return {"result": json.dumps({"error": data.get("error", "Could not load place details")})}

    if name == "update_itinerary":
        if current_itinerary is None:
            return {"result": "Error: update_itinerary requires current itinerary state."}
        operation = args.get("operation") or ""
        day = args.get("day")
        place_id = args.get("place_id") or ""
        fields = args.get("fields")
        if not place_id:
            return {"result": "Error: place_id is required.", "updated_itinerary": current_itinerary}
        try:
            day = int(day)
        except (TypeError, ValueError):
            return {"result": "Error: day must be a number.", "updated_itinerary": current_itinerary}
        if operation not in ("add", "remove", "modify"):
            return {"result": f"Error: operation must be add, remove, or modify.", "updated_itinerary": current_itinerary}
        if operation == "add":
            if not fields or not (fields.get("place_name") or fields.get("name")):
                return {"result": "Error: for add, fields must include place_name (or name).", "updated_itinerary": current_itinerary}
            missing = []
            for k in ("time_window", "description", "estimated_cost_usd", "category_tag"):
                if not fields.get(k):
                    missing.append(k)
            if missing:
                return {
                    "result": f"Error: for add, fields must include {', '.join(missing)}.",
                    "updated_itinerary": current_itinerary,
                }
        updated, msg = _apply_update_itinerary(operation, day, place_id, fields, current_itinerary)
        return {"result": msg, "updated_itinerary": updated}

    return {"result": f"Error: Unknown tool '{name}'."}
