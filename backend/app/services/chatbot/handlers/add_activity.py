"""
TASK-05 — Add activity handler.
Handles add_activity intents. Searches for candidates, selects best fit, returns day patch.
"""
import logging
import os
from typing import Any

from google import genai
from google.genai import types

from app.services.chatbot.schemas import Intent, AddActivityOutput
from app.services.chatbot.context import build_trip_header, compress_day_summary
from app.services.places_service import search_places
from app.services.chatbot.handlers.read import _match_place_name

logger = logging.getLogger(__name__)

PACE_LIMIT = 5
ADD_SYSTEM_PROMPT = """You are planning a trip:
{trip_header}

Current schedule for the target day:
{day_summary}

The user wants to add: "{user_request}"

Choose the best match from these candidates:
{candidates_list}

Rules:
- The time_window must not overlap any existing activity on this day
- The cost band must match the trip budget tier
- Pick the highest-rated option that fits the schedule and budget

Return a single JSON Activity object only:
{{
  "place_name": "...",
  "description": "1–2 sentences tailored to the trip purpose",
  "category_tag": "...",
  "time_window": "HH:MM–HH:MM",
  "estimated_cost_usd": "free | $1–20 | $20–60 | $60+",
  "place_id": "..."
}}"""


def _collect_existing_place_ids(itinerary: list[dict[str, Any]]) -> set[str]:
    """Collect all place_ids already in the itinerary."""
    ids = set()
    for day in itinerary:
        for a in day.get("activities", []):
            pid = a.get("place_id")
            if pid:
                ids.add(pid)
    return ids


def _resolve_target_day(
    intent: Intent,
    itinerary: list[dict[str, Any]],
    pace_limit: int = PACE_LIMIT,
) -> tuple[int | None, dict[str, Any] | None]:
    """Resolve target day. Returns (day_number, day_obj) or (None, None) if all full."""
    if intent.day is not None:
        day_obj = next(
            (d for d in itinerary if d.get("day_number", d.get("day")) == intent.day),
            None,
        )
        if day_obj:
            return intent.day, day_obj
    for d in itinerary:
        num = d.get("day_number", d.get("day"))
        if len(d.get("activities", [])) < pace_limit:
            return num, d
    return None, None


def _remove_activity_from_day(day: dict[str, Any], place_name: str) -> dict[str, Any]:
    """Return copy of day with matching activity removed."""
    activities = [
        a for a in day.get("activities", [])
        if not _match_place_name(place_name, a.get("place_name") or "")
    ]
    return {**day, "activities": activities}


def _format_candidate(p: dict[str, Any]) -> str:
    """Format a place result for the LLM prompt."""
    name = p.get("name", "Unknown")
    pid = p.get("place_id", "")
    rating = p.get("rating", "?")
    types_str = ", ".join(p.get("types", [])[:5]) if p.get("types") else "?"
    price = p.get("price_level", "?")
    return f"- {name} (place_id: {pid}, rating: {rating}, types: {types_str}, price_level: {price})"


async def handle_add(
    intent: Intent,
    trip: dict[str, Any],
    itinerary: list[dict[str, Any]],
    user_message: str,
    *,
    api_key: str | None = None,
) -> tuple[str, dict | None]:
    """
    Handle add_activity intent.
    Returns (response_message, patch or None).
    Patch: { "day": N, "activities": [...] }
    """
    destination = trip.get("destination") or ""

    query = (intent.query or "").strip() or (intent.category or "activities")
    if not query:
        query = "things to do"

    day_num, target_day = _resolve_target_day(intent, itinerary)

    if target_day is None:
        return (
            f"All days look full at this pace — want me to add it to a specific day?",
            None,
        )

    activities_to_use = list(target_day.get("activities", []))
    if intent.place_name:
        target_day = _remove_activity_from_day(target_day, intent.place_name)
        activities_to_use = target_day["activities"]

    existing_ids = _collect_existing_place_ids(itinerary)

    search_query = f"{query} {destination}"
    result = await search_places(query=search_query)

    if result.get("status") != "OK" or not result.get("results"):
        return (
            "I couldn't find anything for that — try being more specific or I can suggest something.",
            None,
        )

    filtered = []
    for p in result["results"]:
        pid = p.get("place_id")
        if not pid or pid in existing_ids:
            continue
        if p.get("business_status") == "CLOSED_PERMANENTLY":
            continue
        filtered.append(p)
        if len(filtered) >= 3:
            break

    if not filtered:
        return (
            "I couldn't find anything new that isn't already in your itinerary — try a different type of activity.",
            None,
        )

    candidates_text = "\n".join(_format_candidate(p) for p in filtered)
    trip_header = build_trip_header(trip)

    adjacent_days = []
    for d in itinerary:
        n = d.get("day_number", d.get("day"))
        if n == day_num - 1 or n == day_num + 1:
            adjacent_days.append(compress_day_summary(d))
    day_summary = compress_day_summary(target_day)
    if adjacent_days:
        day_summary = day_summary + "\n" + "\n".join(adjacent_days)

    system_prompt = ADD_SYSTEM_PROMPT.format(
        trip_header=trip_header,
        day_summary=day_summary,
        user_request=user_message,
        candidates_list=candidates_text,
    )

    client = genai.Client(api_key=api_key or os.getenv("GEMINI_API_KEY"))
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AddActivityOutput,
            temperature=0.3,
            max_output_tokens=300,
        ),
    )

    try:
        activity = AddActivityOutput.model_validate_json(response.text)
    except Exception as e:
        logger.warning(f"Add handler: LLM schema parse failed: {e}")
        return ("Something went wrong picking an activity — please try again.", None)

    new_activity = {
        "place_name": activity.place_name,
        "description": activity.description,
        "category_tag": activity.category_tag,
        "time_window": activity.time_window,
        "estimated_cost_usd": activity.estimated_cost_usd,
        "place_id": activity.place_id,
    }

    updated_activities = activities_to_use + [new_activity]

    patch = {"day": day_num, "activities": updated_activities}
    msg = f"Added {activity.place_name} to Day {day_num}."
    return msg, patch
