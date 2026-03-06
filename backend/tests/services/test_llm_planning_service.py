import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.llm_planning_service import LLMPlanningService, TripProfileRequest, ActivityPattern, DailyTheme

@pytest.fixture
def mock_genai_client():
    with patch('app.services.llm_planning_service.genai.Client') as MockClient:
        mock_instance = MockClient.return_value
        
        # Setup the async mock chain: client.aio.models.generate_content
        mock_instance.aio = MagicMock()
        mock_instance.aio.models = MagicMock()
        mock_instance.aio.models.generate_content = AsyncMock()
        
        yield mock_instance

@pytest.mark.asyncio
async def test_extract_activity_pattern(mock_genai_client):
    # Setup mock JSON response that Gemini would return
    mock_response = MagicMock()
    mock_response.text = '''{
      "max_activities_per_day": 2,
      "trip_vibe": "A relaxing and romantic getaway.",
      "daily_themes": [
        {
          "day_number": 1,
          "theme": "Arrival and Spa",
          "search_queries": ["luxury spa", "fine dining"]
        }
      ],
      "dietary_tags": ["vegetarian"],
      "pacing_rules": "No early mornings"
    }'''
    mock_genai_client.aio.models.generate_content.return_value = mock_response

    # Initialize service with dummy key
    service = LLMPlanningService(api_key="dummy_key")
    
    request = TripProfileRequest(
        destination="Paris",
        duration_days=1,
        purpose="relaxing honeymoon",
        constraints="vegetarian, no early mornings",
        interests=["spa", "fine dining"]
    )
    
    result = await service.extract_activity_pattern(request)
    
    # Verify the JSON was parsed correctly into the Pydantic model
    assert isinstance(result, ActivityPattern)
    assert result.max_activities_per_day == 2
    assert result.trip_vibe == "A relaxing and romantic getaway."
    assert len(result.daily_themes) == 1
    assert result.daily_themes[0].theme == "Arrival and Spa"
    assert "vegetarian" in result.dietary_tags
    assert result.pacing_rules == "No early mornings"

    # Verify the Gemini client was called properly with our inputs
    mock_genai_client.aio.models.generate_content.assert_called_once()
    call_kwargs = mock_genai_client.aio.models.generate_content.call_args.kwargs
    
    prompt_sent = call_kwargs['contents']
    assert "Paris" in prompt_sent
    assert "relaxing honeymoon" in prompt_sent
    assert "vegetarian" in prompt_sent
    assert "spa, fine dining" in prompt_sent
    
    # Verify the schema was passed
    config = call_kwargs['config']
    assert config.response_schema == ActivityPattern
    assert config.response_mime_type == "application/json"
