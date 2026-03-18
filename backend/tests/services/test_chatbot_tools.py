"""Unit tests for chatbot tools (update_itinerary logic and execute_tool)."""
import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from unittest.mock import AsyncMock, patch

from app.services.chatbot.tools import (
    _apply_update_itinerary,
    execute_tool,
    TOOL_DECLARATIONS,
)


SAMPLE_ITINERARY = [
    {
        "day_number": 1,
        "theme": "Day one",
        "activities": [
            {"place_id": "pid-a", "place_name": "Place A", "time_window": "09:00–11:00"},
            {"place_id": "pid-b", "place_name": "Place B", "time_window": "12:00–14:00"},
        ],
    },
    {"day_number": 2, "theme": "Day two", "activities": []},
]


def test_apply_update_itinerary_add():
    updated, msg = _apply_update_itinerary(
        "add", 2, "pid-new", {"place_name": "New Cafe", "time_window": "10:00–11:00"}, SAMPLE_ITINERARY
    )
    assert "Added" in msg and "New Cafe" in msg
    assert len(updated[1]["activities"]) == 1
    assert updated[1]["activities"][0]["place_name"] == "New Cafe"
    assert updated[1]["activities"][0]["place_id"] == "pid-new"
    # Day 1 unchanged
    assert len(updated[0]["activities"]) == 2


def test_apply_update_itinerary_add_uses_name_if_no_place_name():
    updated, msg = _apply_update_itinerary(
        "add", 2, "pid-x", {"name": "From Search"}, SAMPLE_ITINERARY
    )
    assert updated[1]["activities"][0]["place_name"] == "From Search"


def test_apply_update_itinerary_remove():
    updated, msg = _apply_update_itinerary("remove", 1, "pid-b", None, SAMPLE_ITINERARY)
    assert "Removed" in msg
    assert len(updated[0]["activities"]) == 1
    assert updated[0]["activities"][0]["place_id"] == "pid-a"


def test_apply_update_itinerary_remove_nonexistent():
    updated, msg = _apply_update_itinerary("remove", 1, "pid-missing", None, SAMPLE_ITINERARY)
    assert "Error" in msg
    assert updated == SAMPLE_ITINERARY


def test_apply_update_itinerary_modify():
    updated, msg = _apply_update_itinerary(
        "modify", 1, "pid-a", {"time_window": "08:00–10:00"}, SAMPLE_ITINERARY
    )
    assert "Updated" in msg
    assert updated[0]["activities"][0]["time_window"] == "08:00–10:00"
    assert updated[0]["activities"][0]["place_name"] == "Place A"


def test_apply_update_itinerary_day_not_found():
    updated, msg = _apply_update_itinerary("add", 99, "pid-x", {"place_name": "X"}, SAMPLE_ITINERARY)
    assert "Day 99" in msg and "not found" in msg
    assert updated == SAMPLE_ITINERARY


def test_tool_declarations_have_three_tools():
    names = [d["name"] for d in TOOL_DECLARATIONS]
    assert "search_places" in names
    assert "get_place_details" in names
    assert "update_itinerary" in names


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_add():
    result = await execute_tool(
        "update_itinerary",
        {"operation": "add", "day": 2, "place_id": "new-id", "fields": {"place_name": "New Place"}},
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Added" in result["result"]
    assert "updated_itinerary" in result
    assert len(result["updated_itinerary"][1]["activities"]) == 1


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_requires_current_itinerary():
    result = await execute_tool("update_itinerary", {"operation": "add", "day": 1, "place_id": "x", "fields": {"place_name": "Y"}}, current_itinerary=None)
    assert "Error" in result["result"]
    assert "updated_itinerary" not in result or result.get("updated_itinerary") is None


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_add_requires_place_name():
    result = await execute_tool(
        "update_itinerary",
        {"operation": "add", "day": 2, "place_id": "x", "fields": {}},
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Error" in result["result"]
    assert "place_name" in result["result"] or "name" in result["result"]


@pytest.mark.asyncio
async def test_execute_tool_unknown_tool():
    result = await execute_tool("unknown_tool", {}, current_itinerary=[])
    assert "Unknown tool" in result["result"]
