"""API tests for POST /api/trips/{trip_id}/chat (chatbot endpoint)."""
import pytest
import sys
import os
import uuid
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.api.generation import get_db, require_clerk_user
from app.db.database import get_db as real_get_db


@pytest.fixture
def mock_clerk():
    async def _return_test_user():
        return "test-clerk-id"
    with patch.object(require_clerk_user, "__call__", _return_test_user):
        # FastAPI resolves Depends(require_clerk_user) by calling the dependency
        app.dependency_overrides[require_clerk_user] = lambda: "test-clerk-id"
        yield
        app.dependency_overrides.pop(require_clerk_user, None)


@pytest.fixture
def mock_user():
    u = MagicMock()
    u.id = uuid.uuid4()
    return u


@pytest.fixture
def mock_trip(mock_user):
    trip_id = uuid.uuid4()
    t = MagicMock()
    t.id = trip_id
    t.user_id = mock_user.id
    mock_activity = MagicMock()
    mock_activity.place_name = "Place A"
    mock_activity.place_id = "pid-a"
    mock_activity.category_tag = None
    mock_activity.time_window = "09:00–11:00"
    mock_activity.estimated_cost_usd = None
    mock_activity.description = None
    mock_day = MagicMock()
    mock_day.day_number = 1
    mock_day.theme = "Theme 1"
    mock_day.activities = [mock_activity]
    t.itinerary_dates = [mock_day]
    return t


@pytest.fixture
def mock_db_session(mock_user, mock_trip):
    user_result = MagicMock()
    user_result.scalar_one_or_none = MagicMock(return_value=mock_user)
    trip_result = MagicMock()
    trip_result.scalar_one_or_none = MagicMock(return_value=mock_trip)
    session = MagicMock()
    session.execute = AsyncMock(side_effect=[user_result, trip_result])
    session.delete = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    return session


@pytest.fixture
def override_get_db(mock_db_session):
    async def _get_db():
        yield mock_db_session
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def mock_agent():
    with patch("app.services.chatbot.service.run_chatbot_agent", new_callable=AsyncMock) as m:
        m.return_value = {
            "message": "I've added a cafe to Day 2.",
            "itinerary": [
                {"day_number": 1, "theme": "Theme 1", "activities": [{"place_name": "Place A", "place_id": "pid-a", "time_window": "09:00–11:00", "category_tag": None, "estimated_cost_usd": None, "description": None}]},
                {"day_number": 2, "theme": "Theme 2", "activities": [{"place_name": "New Cafe", "place_id": "pid-new", "time_window": "10:00–11:00", "category_tag": "food", "estimated_cost_usd": None, "description": None}]},
            ],
        }
        yield m


def test_trip_chat_returns_message_and_itinerary(mock_clerk, override_get_db, mock_agent, mock_trip):
    client = TestClient(app)
    response = client.post(
        f"/api/trips/{mock_trip.id}/chat",
        json={"message": "Add a cafe to day 2"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "itinerary" in data
    assert "I've added" in data["message"] or "cafe" in data["message"].lower()
    assert len(data["itinerary"]) == 2
    assert data["itinerary"][1]["day_number"] == 2
    assert any(a.get("place_name") == "New Cafe" for a in data["itinerary"][1]["activities"])
    mock_agent.assert_called_once()
    call_kwargs = mock_agent.call_args.kwargs
    assert call_kwargs["user_message"] == "Add a cafe to day 2"
    assert "trip" in call_kwargs and "itinerary" in call_kwargs


def test_trip_chat_401_without_auth(override_get_db, mock_agent, mock_trip):
    """Without overriding auth, request would get 401 (no Bearer token)."""
    # Clear clerk override so auth is required
    if require_clerk_user in app.dependency_overrides:
        app.dependency_overrides.pop(require_clerk_user, None)
    client = TestClient(app)
    response = client.post(
        f"/api/trips/{mock_trip.id}/chat",
        json={"message": "Hello"},
    )
    # No Bearer token -> 401
    assert response.status_code == 401


def test_trip_chat_400_empty_message(mock_clerk, override_get_db, mock_agent, mock_trip):
    client = TestClient(app)
    response = client.post(
        f"/api/trips/{mock_trip.id}/chat",
        json={"message": ""},
    )
    assert response.status_code == 422  # validation error (min_length=1)


def test_trip_chat_404_when_user_not_found(mock_clerk, mock_agent, mock_trip):
    """When DB returns no user, endpoint returns 404."""
    user_result = MagicMock()
    user_result.scalar_one_or_none = MagicMock(return_value=None)
    session = MagicMock()
    session.execute = AsyncMock(return_value=user_result)
    async def _get_db():
        yield session
    app.dependency_overrides[get_db] = _get_db
    try:
        client = TestClient(app)
        response = client.post(
            f"/api/trips/{mock_trip.id}/chat",
            json={"message": "Hi"},
        )
        assert response.status_code == 404
        assert "User" in response.json().get("detail", "")
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_trip_chat_404_when_trip_not_found(mock_clerk, mock_user, mock_agent):
    """When user exists but trip does not, endpoint returns 404."""
    user_result = MagicMock()
    user_result.scalar_one_or_none = MagicMock(return_value=mock_user)
    trip_result = MagicMock()
    trip_result.scalar_one_or_none = MagicMock(return_value=None)
    session = MagicMock()
    session.execute = AsyncMock(side_effect=[user_result, trip_result])
    async def _get_db():
        yield session
    app.dependency_overrides[get_db] = _get_db
    try:
        client = TestClient(app)
        response = client.post(
            f"/api/trips/{uuid.uuid4()}/chat",
            json={"message": "Hi"},
        )
        assert response.status_code == 404
        assert "Trip" in response.json().get("detail", "")
    finally:
        app.dependency_overrides.pop(get_db, None)
