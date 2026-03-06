import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def mock_orchestrator():
    # We patch the dependency override in the FastAPI app
    with patch('app.api.generation.GenerationOrchestrator') as MockOrchestrator:
        mock_instance = MockOrchestrator.return_value
        mock_instance.generate_full_itinerary = AsyncMock()
        
        # Setup the mock to return a fake successful itinerary payload
        mock_instance.generate_full_itinerary.return_value = {
            "destination": "Test City",
            "start_date": "2026-04-01",
            "duration_days": 1,
            "profile_applied": {},
            "itinerary": [
                {
                    "day_number": 1,
                    "theme": "Test Theme",
                    "activities": []
                }
            ]
        }
        
        # We also need to override the dependency in the FastAPI app for the test duration
        from app.api.generation import get_orchestrator
        app.dependency_overrides[get_orchestrator] = lambda: mock_instance
        
        yield mock_instance
        
        # Cleanup
        app.dependency_overrides.clear()


from fastapi.testclient import TestClient

def test_generate_itinerary_endpoint(mock_orchestrator):
    # This is the expected flat JSON payload the user would send to the API
    payload = {
        "destination": "Test City",
        "start_date": "2026-04-01",
        "duration_days": 1,
        "purpose": "A quick testing trip",
        "constraints": "none",
        "interests": ["testing", "APIs"]
    }
    
    # Use TestClient to simulate a real request to the ASGI app
    client = TestClient(app)
    response = client.post("/api/generate", json=payload)
        
    if response.status_code != 200:
        print(f"FAILED WITH {response.status_code}: {response.text}")
        
    assert response.status_code == 200
    
    data = response.json()
    assert data["destination"] == "Test City"
    assert data["duration_days"] == 1
    assert data["itinerary"][0]["theme"] == "Test Theme"
    
    # Ensure our mock orchestrator was called with the arguments extracted from the payload
    mock_orchestrator.generate_full_itinerary.assert_called_once()
    call_kwargs = mock_orchestrator.generate_full_itinerary.call_args.kwargs
    
    assert call_kwargs["destination"] == "Test City"
    assert call_kwargs["start_date"] == "2026-04-01"
    assert call_kwargs["duration_days"] == 1
    assert call_kwargs["trip_request"].purpose == "A quick testing trip"
