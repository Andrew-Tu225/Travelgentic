import os
import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API")

def _get_fallback_date(target_date: str, forecast_list: list) -> Optional[str]:
    """Helper function to find a valid fallback date due to timezone offsets."""
    if not forecast_list:
        return None
        
    first_available_date = forecast_list[0].get("dt_txt", "").split(" ")[0]
    try:
        req_dt = datetime.strptime(target_date, "%Y-%m-%d")
        first_dt = datetime.strptime(first_available_date, "%Y-%m-%d")
        
        # If target date is just 1 day behind UTC's first available date, roll it forward
        if abs((req_dt - first_dt).days) <= 1:
            return first_available_date
    except ValueError:
        pass
        
    return None

async def get_forecast(
    lat: float, 
    lng: float, 
    target_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get the weather forecast for a specified latitude and longitude for a date.
    
    Args:
        lat: Latitude of the location.
        lng: Longitude of the location.
        target_date: (Optional) The date to get the forecast for in 'YYYY-MM-DD' format.
                     If None, it will return the forecast for today (or the earliest available).
                     Note: OpenWeather free tier only provides 5 days into the future.
                     
    Returns:
        A dictionary with the forecast including:
        {date, condition, temp_high, temp_low, rain_probability}
        or an error dictionary if it fails.
    """
    if not OPENWEATHER_API_KEY:
        logger.error("OPENWEATHER_API_KEY is not set.")
        return {"status": "error", "error": "Weather API key not configured."}
        
    url = "https://api.openweathermap.org/data/2.5/forecast"
    
    params = {
        "lat": lat,
        "lon": lng,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric" # We will use Celsius by default
    }
    
    # If no target date provided, use today's date
    if not target_date:
        target_date = datetime.now().strftime('%Y-%m-%d')
        
    try:
        logger.info(f"Fetching OpenWeather forecast for lat: {lat}, lng: {lng}, date: {target_date}")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            
            if response.status_code == 404:
                return {"status": "error", "error": "Location not found."}
            elif response.status_code == 400:
                return {"status": "error", "error": "Invalid coordinates provided."}
                
            response.raise_for_status()
            data = response.json()
            
            # The 5 day / 3 hour forecast returns a list of 40 timestamps
            forecast_list = data.get("list", [])
            
            # Filter the forecasts for the specific target date
            day_forecasts = [
                f for f in forecast_list 
                if f.get("dt_txt", "").startswith(target_date)
            ]
            
            if not day_forecasts:
                fallback_date = _get_fallback_date(target_date, forecast_list)

                # Handling Timezone Offsets
                if fallback_date:
                    logger.warning(f"Target date {target_date} not found. Defaulting to fallback UTC date {fallback_date}.")
                    target_date = fallback_date
                    day_forecasts = [
                        f for f in forecast_list 
                        if f.get("dt_txt", "").startswith(target_date)
                    ]
                
                # If it's still empty despite the fallback attempts, then raise error
                else:
                    return {
                        "status": "error", 
                        "error": f"No forecast available for date {target_date}. The date might be too far in the past or future (max 5 days)."
                    }
                
            # Aggregate the 3-hour windows into a daily summary
            temps_max = [f["main"]["temp_max"] for f in day_forecasts]
            temps_min = [f["main"]["temp_min"] for f in day_forecasts]
            
            # Probability of precipitation (0 to 1)
            pops = [f.get("pop", 0) for f in day_forecasts]
            
            # Get the most common or 'worst' weather condition
            # For simplicity, we'll grab the weather condition from the middle of the day (noonish) 
            # or the first available if there aren't many
            mid_index = len(day_forecasts) // 2
            condition = day_forecasts[mid_index]["weather"][0]["description"].capitalize()
            
            # Construct the final result
            result = {
                "status": "success",
                "date": target_date,
                "condition": condition,
                "temp_high": max(temps_max),
                "temp_low": min(temps_min),
                "rain_probability": max(pops) * 100 # Convert to percentage
            }
            
            return result
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching weather: {e}")
        return {"status": "error", "error": "Failed to connect to weather service."}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"status": "error", "error": str(e)}
