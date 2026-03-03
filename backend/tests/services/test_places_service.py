import pytest
import httpx
from unittest.mock import patch, MagicMock
from app.services.places_service import search_places, get_place_details, get_place_photos

# Valid Eiffel Tower Place ID for testing
TEST_PLACE_ID = "ChIJLU7jZClu5kcR4PcOOO6p3I0"

@pytest.mark.asyncio
async def test_search_places_with_expected_fields():
    """
    Test that search_places returns results with the expected structure
    and includes ratings, hours (if available), and coordinates.
    """
    query = "famous museums in Lisbon"
    
    result = await search_places(query=query)
    
    # Check overall success
    assert result.get("status") == "OK"
    results = result.get("results", [])
    
    # We expect to find at least one museum in Lisbon
    assert len(results) > 0
    
    # Check the first few results for expected fields
    for place in results[:3]:
        # Basic fields
        assert "name" in place
        assert "formatted_address" in place
        assert "place_id" in place
        
        # Check Coordinates
        assert "geometry" in place
        assert "location" in place["geometry"]
        assert "lat" in place["geometry"]["location"]
        assert "lng" in place["geometry"]["location"]
        
        # Check Ratings (note: some newly added places might lack ratings, 
        # but famous museums will certainly have them)
        assert "rating" in place
        assert isinstance(place["rating"], (int, float))
        assert "user_ratings_total" in place
        assert isinstance(place["user_ratings_total"], int)
        
        # Check Hours (Note: text search generally only returns 'open_now' under 'opening_hours'.
        # For full daily hours, one would need to call `get_place_details`.)
        if "opening_hours" in place:
            assert "open_now" in place["opening_hours"]
            assert isinstance(place["opening_hours"]["open_now"], bool)

@pytest.mark.asyncio
async def test_search_places_missing_api_key():
    """Test behavior when the Google API key is missing."""
    with patch('app.services.places_service.GOOGLE_PLACE_API_KEY', None):
        result = await search_places(query="museums in Lisbon")
        assert result.get("status") == "REQUEST_DENIED"
        assert result.get("error") == "API key not configured."

@pytest.mark.asyncio
@patch("app.services.places_service.httpx.AsyncClient.get")
async def test_search_places_http_error(mock_get):
    """Test behavior when the Google API returns an HTTP error."""
    from unittest.mock import MagicMock
    # Setup mock to raise HTTPStatusError
    mock_response = MagicMock()
    # Dummy request and response for the error
    mock_request = httpx.Request("GET", "https://maps.googleapis.com/maps/api/place/textsearch/json")
    mock_err_response = httpx.Response(500, request=mock_request)
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        message="Internal Server Error", request=mock_request, response=mock_err_response
    )
    mock_get.return_value = mock_response

    result = await search_places(query="museums in Lisbon")
    
    assert result.get("status") == "UNKNOWN_ERROR"
    assert "HTTP 500" in result.get("error")

@pytest.mark.asyncio
@patch("app.services.places_service.httpx.AsyncClient.get")
async def test_search_places_timeout(mock_get):
    """Test behavior when the API request times out."""
    mock_get.side_effect = httpx.TimeoutException("Timeout")
    
    result = await search_places(query="museums in Lisbon")
    
    assert result.get("status") == "UNKNOWN_ERROR"
    assert result.get("error") == "Timeout"

@pytest.mark.asyncio
async def test_get_place_details():
    """Test that get_place_details returns the correct place name and expected fields."""
    result = await get_place_details(place_id=TEST_PLACE_ID)
    
    assert result.get("status") == "OK"
    assert "result" in result
    
    place = result["result"]
    assert place.get("name") == "Eiffel Tower"
    assert "formatted_address" in place
    
    # Phone numbers are optional depending on the place and API access level
    if "formatted_phone_number" in place:
        assert isinstance(place["formatted_phone_number"], str)

    assert "geometry" in place
    assert "rating" in place

@pytest.mark.asyncio
async def test_get_place_details_invalid_id():
    """Test behavior with an invalid place ID."""
    result = await get_place_details(place_id="INVALID_ID_123")
    assert result.get("status") == "INVALID_REQUEST"

@pytest.mark.asyncio
async def test_get_place_photos():
    """Test get_place_photos correctly generates photo URLs."""
    urls = await get_place_photos(place_id=TEST_PLACE_ID, max_width=400)
    
    # We expect lists of URLs to come back
    assert isinstance(urls, list)
    assert len(urls) > 0
    
    # Check URL structure
    for url in urls[:3]:
        assert url.startswith("https://maps.googleapis.com/maps/api/place/photo")
        assert "maxwidth=400" in url
        assert "photo_reference=" in url
        assert "key=" in url

@pytest.mark.asyncio
async def test_get_place_photos_invalid_id():
    """Test behavior of get_place_photos with an invalid place ID."""
    urls = await get_place_photos(place_id="INVALID_ID_123")
    
    # Because details will be invalid, photos should safely return empty list
    assert urls == []