import pytest
from datetime import datetime, timedelta
from app.services.weather_service import get_forecast

@pytest.mark.asyncio
async def test_get_forecast_today():
    """Test getting a valid weather forecast for today using coordinates."""
    today = datetime.now().strftime('%Y-%m-%d')
    # London coordinates approximate
    result = await get_forecast(lat=51.5074, lng=-0.1278, target_date=today)
    
    assert result.get("status") == "success"
    assert "date" in result
    assert "condition" in result
    assert "temp_high" in result
    assert "temp_low" in result
    assert "rain_probability" in result
    
    assert isinstance(result["temp_high"], (int, float))
    assert isinstance(result["temp_low"], (int, float))
    assert isinstance(result["rain_probability"], (int, float))

@pytest.mark.asyncio
async def test_get_forecast_tomorrow():
    """Test getting a valid forecast for tomorrow."""
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    # Tokyo coordinates approximate
    result = await get_forecast(lat=35.6762, lng=139.6503, target_date=tomorrow)
    
    assert result.get("status") == "success"
    assert result.get("date") == tomorrow
    assert "condition" in result
    assert "temp_high" in result
    assert "rain_probability" in result
    
    assert isinstance(result["temp_high"], (int, float))
    assert isinstance(result["temp_low"], (int, float))
    assert isinstance(result["rain_probability"], (int, float))

@pytest.mark.asyncio
async def test_get_forecast_invalid_coordinates():
    """Test behavior when invalid coordinates (out of bounds) are provided."""
    result = await get_forecast(lat=999.0, lng=999.0)
    
    assert result.get("status") == "error"
    assert "Invalid coordinates" in result.get("error")

@pytest.mark.asyncio
async def test_get_forecast_invalid_date_too_far():
    """Test behavior when the requested date is outside the 5-day window."""
    too_far_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
    result = await get_forecast(lat=51.5074, lng=-0.1278, target_date=too_far_date)
    
    assert result.get("status") == "error"
    assert "too far in the past or future" in result.get("error")
