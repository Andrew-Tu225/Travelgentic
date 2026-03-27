"""
Tests for the current chatbot stack: Gemini agent loop, tool executor, and service wiring.

The chatbot uses a tool-calling agent (see app.services.chatbot.agent) that invokes
execute_tool from tools.py. Context helpers are covered in test_chatbot_context.py.
"""
import os
import sys
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.chatbot.tools import TOOL_DECLARATIONS, execute_tool, _apply_update_itinerary
from app.services.chatbot.agent import run_chatbot_agent, MAX_ITERATIONS
from app.services.chatbot.service import process_chat_message


SAMPLE_ITINERARY = [
    {
        "day_number": 1,
        "theme": "Day one",
        "activities": [
            {"place_id": "pid-a", "place_name": "Place A", "time_window": "09:00–11:00"},
        ],
    },
    {"day_number": 2, "theme": "Day two", "activities": []},
]

SAMPLE_TRIP_DICT = {
    "destination": "Lisbon, Portugal",
    "origin": "London",
    "month": "June",
    "start_date": "2026-06-01",
    "duration_days": 2,
    "budget": "mid",
    "trip_vibe": "Food and culture",
    "itinerary": SAMPLE_ITINERARY,
}


def _full_add_fields(place_name: str = "New Place") -> dict:
    """Fields required by execute_tool for update_itinerary add (matches agent contract)."""
    return {
        "place_name": place_name,
        "time_window": "10:00–12:00",
        "description": "Test activity",
        "estimated_cost_usd": "$1-20",
        "category_tag": "food",
    }


# ─── Tool declarations (agent registers these with Gemini) ─────────────────


def test_tool_declarations_include_agent_tools():
    names = [d["name"] for d in TOOL_DECLARATIONS]
    assert names == ["search_places", "get_place_details", "update_itinerary"]


# ─── execute_tool — used by the agent on each tool call ─────────────────────


@pytest.mark.asyncio
@patch("app.services.chatbot.tools._search_places", new_callable=AsyncMock)
async def test_execute_tool_search_places_returns_summary(mock_search):
    mock_search.return_value = {
        "status": "OK",
        "results": [
            {"name": "Cafe X", "place_id": "ChIJ1", "rating": 4.5, "types": ["cafe"]},
        ],
    }
    out = await execute_tool(
        "search_places",
        {"query": "coffee in Lisbon"},
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Cafe X" in out["result"]
    assert "ChIJ1" in out["result"]


@pytest.mark.asyncio
@patch("app.services.chatbot.tools._get_place_details", new_callable=AsyncMock)
async def test_execute_tool_get_place_details_returns_json(mock_details):
    mock_details.return_value = {
        "status": "OK",
        "result": {
            "name": "Tower",
            "formatted_address": "1 Main St",
            "rating": 4.8,
            "user_ratings_total": 1000,
            "types": ["tourist_attraction"],
            "opening_hours": {},
            "editorial_summary": {"overview": "Iconic landmark."},
        },
    }
    out = await execute_tool(
        "get_place_details",
        {"place_id": "ChIJtower"},
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Tower" in out["result"]
    assert "Iconic" in out["result"]


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_add_with_required_fields():
    result = await execute_tool(
        "update_itinerary",
        {
            "operation": "add",
            "day": 2,
            "place_id": "new-id",
            "fields": _full_add_fields("New Cafe"),
        },
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Added" in result["result"]
    assert "New Cafe" in result["result"]
    assert len(result["updated_itinerary"][1]["activities"]) == 1
    assert result["updated_itinerary"][1]["activities"][0]["place_id"] == "new-id"


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_requires_current_itinerary():
    result = await execute_tool(
        "update_itinerary",
        {
            "operation": "add",
            "day": 1,
            "place_id": "x",
            "fields": _full_add_fields(),
        },
        current_itinerary=None,
    )
    assert "Error" in result["result"]
    assert "current itinerary" in result["result"].lower()


@pytest.mark.asyncio
async def test_execute_tool_update_itinerary_add_rejects_incomplete_fields():
    result = await execute_tool(
        "update_itinerary",
        {
            "operation": "add",
            "day": 2,
            "place_id": "x",
            "fields": {"place_name": "Only name"},
        },
        current_itinerary=SAMPLE_ITINERARY,
    )
    assert "Error" in result["result"]
    assert "fields must include" in result["result"]


# ─── _apply_update_itinerary — pure itinerary patch (also used after validation) ─


def test_apply_update_itinerary_remove():
    updated, msg = _apply_update_itinerary("remove", 1, "pid-a", None, SAMPLE_ITINERARY)
    assert "Removed" in msg
    assert len(updated[0]["activities"]) == 0


def test_apply_update_itinerary_modify_time_window():
    updated, msg = _apply_update_itinerary(
        "modify",
        1,
        "pid-a",
        {"time_window": "08:00–09:30"},
        SAMPLE_ITINERARY,
    )
    assert "Updated" in msg
    assert updated[0]["activities"][0]["time_window"] == "08:00–09:30"


# ─── run_chatbot_agent — Gemini loop (Client mocked) ─────────────────────────


@pytest.fixture(autouse=True)
def gemini_api_key():
    os.environ["GEMINI_API_KEY"] = "test-key-for-ci"
    yield
    os.environ.pop("GEMINI_API_KEY", None)


def _make_response_no_tools(text: str):
    r = MagicMock()
    r.function_calls = []
    r.candidates = [MagicMock()]
    r.text = text
    return r


def _make_response_with_tool_calls(function_calls: list):
    r = MagicMock()
    r.function_calls = function_calls
    r.candidates = [MagicMock(content=MagicMock(parts=[]))]
    return r


@pytest.mark.asyncio
async def test_run_chatbot_agent_returns_model_text_without_tool_calls():
    final = _make_response_no_tools("Your itinerary looks great.")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=final)

    with patch("app.services.chatbot.agent.genai.Client", return_value=mock_client):
        out = await run_chatbot_agent(
            trip=SAMPLE_TRIP_DICT,
            itinerary=list(SAMPLE_ITINERARY),
            user_message="Hello",
        )

    assert out["message"] == "Your itinerary looks great."
    assert len(out["itinerary"]) == 2
    mock_client.aio.models.generate_content.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_chatbot_agent_executes_update_itinerary_then_returns_final_text():
    fc = MagicMock()
    fc.name = "update_itinerary"
    fc.args = {
        "operation": "add",
        "day": 2,
        "place_id": "agent-new",
        "fields": _full_add_fields("Agent Cafe"),
    }

    first = _make_response_with_tool_calls([fc])
    second = _make_response_no_tools("Added Agent Cafe to day 2.")

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=[first, second])

    with patch("app.services.chatbot.agent.genai.Client", return_value=mock_client):
        out = await run_chatbot_agent(
            trip=SAMPLE_TRIP_DICT,
            itinerary=list(SAMPLE_ITINERARY),
            user_message="Add a cafe on day 2",
        )

    assert "Added Agent Cafe" in out["message"] or "day 2" in out["message"].lower()
    assert len(out["itinerary"][1]["activities"]) == 1
    assert out["itinerary"][1]["activities"][0]["place_id"] == "agent-new"
    assert mock_client.aio.models.generate_content.await_count == 2


@pytest.mark.asyncio
async def test_run_chatbot_agent_stops_after_max_iterations():
    fc = MagicMock()
    fc.name = "search_places"
    fc.args = {"query": "test"}
    stuck = _make_response_with_tool_calls([fc])

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=stuck)

    with patch("app.services.chatbot.agent.genai.Client", return_value=mock_client):
        with patch("app.services.chatbot.agent.execute_tool", new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = {"result": "ok"}
            out = await run_chatbot_agent(
                trip=SAMPLE_TRIP_DICT,
                itinerary=list(SAMPLE_ITINERARY),
                user_message="Search forever",
            )

    assert "step limit" in out["message"].lower() or "limit" in out["message"].lower()
    assert mock_client.aio.models.generate_content.await_count == MAX_ITERATIONS


# ─── process_chat_message — agent + persistence ──────────────────────────────


@pytest.mark.asyncio
async def test_process_chat_message_runs_agent_and_upserts_itinerary():
    trip_orm = MagicMock()
    trip_orm.id = uuid.uuid4()

    trip_dict = {**SAMPLE_TRIP_DICT, "itinerary": list(SAMPLE_ITINERARY)}
    new_itinerary = [
        SAMPLE_ITINERARY[0],
        {
            "day_number": 2,
            "theme": "Day two",
            "activities": [
                {
                    "place_id": "p-new",
                    "place_name": "Saved",
                    "time_window": "10:00–11:00",
                    "description": "x",
                    "estimated_cost_usd": "$1-20",
                    "category_tag": "food",
                }
            ],
        },
    ]

    mock_db = AsyncMock()

    with patch(
        "app.services.chatbot.service.run_chatbot_agent",
        new_callable=AsyncMock,
    ) as mock_agent:
        mock_agent.return_value = {"message": "Done.", "itinerary": new_itinerary}
        with patch(
            "app.services.chatbot.service.upsert_itinerary",
            new_callable=AsyncMock,
        ) as mock_upsert:
            result = await process_chat_message(
                trip_orm,
                trip_dict,
                "Add something",
                mock_db,
            )

    assert result["message"] == "Done."
    assert result["itinerary"] == new_itinerary
    mock_agent.assert_awaited_once()
    mock_upsert.assert_awaited_once_with(mock_db, trip_orm, new_itinerary)
