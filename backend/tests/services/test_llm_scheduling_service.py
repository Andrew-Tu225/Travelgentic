import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.llm_scheduling_service import LLMSchedulingService, DailySchedule

@pytest.fixture
def mock_genai_client():
    with patch('app.services.llm_scheduling_service.genai.Client') as MockClient:
        mock_instance = MockClient.return_value
        
        # Setup the async mock chain: client.aio.models.generate_content
        mock_instance.aio = MagicMock()
        mock_instance.aio.models = MagicMock()
        mock_instance.aio.models.generate_content = AsyncMock()
        
        yield mock_instance

@pytest.mark.asyncio
async def test_generate_day_schedule(mock_genai_client):
    # Setup mock JSON response representing a day's schedule
    mock_response = MagicMock()
    mock_response.text = """
    {
      "day_number": 1,
      "theme": "Relaxing Downtown",
      "activities": [
        {
          "place_name": "Central Spa",
          "description": "A relaxing morning massage to kick off the honeymoon.",
          "category_tag": "wellness",
          "time_window": "10:00-12:00",
          "estimated_cost_usd": "$60+",
          "place_id": "ChIJspa123"
        },
        {
          "place_name": "Ocean View Restaurant",
          "description": "Vegetarian fine dining strictly following dietary rules.",
          "category_tag": "food",
          "time_window": "13:00-15:00",
          "estimated_cost_usd": "$20-60",
          "place_id": "ChIJfood456"
        }
      ]
    }
    """
    mock_genai_client.aio.models.generate_content.return_value = mock_response

    # Initialize service
    service = LLMSchedulingService(api_key="dummy_key")
    
    # Mock inputs passing into the test
    profile_rules = {
        "max_activities_per_day": 2,
        "pacing_rules": "No early mornings, vegetarian.",
    }
    
    place_candidates = [
        {"name": "Central Spa", "place_id": "ChIJspa123"},
        {"name": "Ocean View Restaurant", "place_id": "ChIJfood456"},
        {"name": "Loud Night Club", "place_id": "ChIJclub789"}
    ]
    
    result = await service.generate_day_schedule(
        day_number=1,
        destination_city="San Diego",
        profile_rules=profile_rules,
        day_theme="Relaxing Downtown",
        place_candidates=place_candidates
    )
    
    # Assertions on the parsed Pydantic model
    assert isinstance(result, DailySchedule)
    assert result.day_number == 1
    assert result.theme == "Relaxing Downtown"
    assert len(result.activities) == 2
    
    # Check specific fields of an activity
    activity1 = result.activities[0]
    assert activity1.place_name == "Central Spa"
    assert activity1.category_tag == "wellness"
    assert activity1.estimated_cost_usd == "$60+"
    
    activity2 = result.activities[1]
    assert activity2.place_name == "Ocean View Restaurant"
    assert activity2.category_tag == "food"
    
    # Verify the client was called with the embedded rules
    mock_genai_client.aio.models.generate_content.assert_called_once()
    prompt_sent = mock_genai_client.aio.models.generate_content.call_args.kwargs['contents']
    assert "San Diego" in prompt_sent
    assert "No early mornings, vegetarian" in prompt_sent
    assert "Central Spa" in prompt_sent
    assert "Relaxing Downtown" in prompt_sent
