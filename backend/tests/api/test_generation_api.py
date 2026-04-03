import pytest
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.api.generation import get_db
from app.repositories.trip_repository import format_trip_response


@pytest.fixture
def mock_db_session():
    """Async session that assigns UUIDs on flush so Trip persistence succeeds."""
    added = []

    async def flush_impl():
        for obj in added:
            if hasattr(obj, "id") and getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    session = MagicMock()
    session.execute = AsyncMock()
    session.add = MagicMock(side_effect=lambda o: added.append(o))
    session.flush = AsyncMock(side_effect=flush_impl)
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


@pytest.fixture
def override_get_db(mock_db_session):
    async def _get_db():
        yield mock_db_session

    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def mock_orchestrator():
    with patch("app.api.generation.GenerationOrchestrator") as MockOrchestrator:
        mock_instance = MockOrchestrator.return_value
        mock_instance.generate_full_itinerary = AsyncMock()
        mock_instance.generate_full_itinerary.return_value = {
            "destination": "Test City",
            "origin": "New York",
            "month": "April",
            "start_date": "2026-04-01",
            "duration_days": 1,
            "budget": "mid",
            "trip_vibe": "A quick testing trip.",
            "city_image_url": "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=ref&key=test",
            "itinerary": [
                {
                    "day_number": 1,
                    "theme": "Test Theme",
                    "activities": [],
                }
            ],
        }

        from app.api.generation import get_orchestrator

        app.dependency_overrides[get_orchestrator] = lambda: mock_instance
        yield mock_instance
        app.dependency_overrides.pop(get_orchestrator, None)


def test_generate_itinerary_endpoint(override_get_db, mock_orchestrator):
    payload = {
        "destination": "Test City",
        "origin": "New York",
        "month": "April",
        "duration_days": 1,
        "purpose": "A quick testing trip",
        "budget": "mid",
        "interests": ["testing", "APIs"],
    }

    client = TestClient(app)
    response = client.post("/api/generate", json=payload)

    if response.status_code != 200:
        print(f"FAILED WITH {response.status_code}: {response.text}")

    assert response.status_code == 200

    data = response.json()
    assert data["destination"] == "Test City"
    assert data["duration_days"] == 1
    assert data["budget"] == "mid"
    assert data["itinerary"][0]["theme"] == "Test Theme"
    assert data["city_image_url"] == mock_orchestrator.generate_full_itinerary.return_value[
        "city_image_url"
    ]
    assert "trip_id" in data

    mock_orchestrator.generate_full_itinerary.assert_called_once()
    call_kwargs = mock_orchestrator.generate_full_itinerary.call_args.kwargs

    assert call_kwargs["start_date"] == "2026-04-01"
    assert call_kwargs["trip_request"].purpose == "A quick testing trip"
    assert call_kwargs["trip_request"].budget == "mid"
    assert call_kwargs["trip_request"].origin == "New York"


def test_format_trip_response_includes_city_image_url():
    trip = MagicMock()
    trip.id = uuid.uuid4()
    trip.destination = "Paris, France"
    trip.origin = "NYC"
    trip.month = "June"
    trip.start_date = MagicMock()
    trip.start_date.isoformat = MagicMock(return_value="2026-06-01")
    trip.duration_days = 3
    trip.budget = "mid"
    trip.trip_vibe = "Romantic"
    trip.city_image_url = "https://example.com/city.jpg"
    trip.itinerary_dates = []

    out = format_trip_response(trip)
    assert out["city_image_url"] == "https://example.com/city.jpg"
    assert out["trip_id"] == str(trip.id)
    assert out["destination"] == "Paris, France"
