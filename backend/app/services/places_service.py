import os
import httpx
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Configure basic logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    # Add a stream handler if not already present to avoid duplicate logs in some setups
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Load environment variables
load_dotenv()

GOOGLE_PLACE_API_KEY = os.getenv("GOOGLE_PLACE_API")

async def search_places(
    query: str,
    location: Optional[str] = None, 
    radius: Optional[int] = None
) -> Dict[str, Any]:
    """
    Search for places using the Google Places Text Search API.
    
    This function is ideal for providing as a tool to an LLM, as it allows natural language 
    queries and handles broad geographical searches effectively.
    
    Args:
        query: The natural language text string to search for. Including the location in the query 
               is highly recommended. Example: "Thai restaurant in Sydney, Australia", 
               "museums in Paris", or "coffee shops near Central Park".
        location: (Optional) The latitude and longitude to bias the results around, formatted 
                  as a string: "lat,lng" (e.g., "-33.8670522,151.1957362"). This is NOT a city name.
                  If you only have a city name, put it in the `query` instead.
        radius: (Optional) Defines the distance (in meters) within which to bias place results, 
                used in conjunction with `location`. Maximum is 50000.
        
    Returns:
        JSON response from Google Places API containing a list of matching places.
        Returns an empty "results" list and an "error" key if the API call fails.
    """
    if not GOOGLE_PLACE_API_KEY:
        logger.error("GOOGLE_PLACE_API is not set in environment variables.")
        return {"status": "REQUEST_DENIED", "results": [], "error": "API key not configured."}

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    
    params = {
        "query": query,
        "key": GOOGLE_PLACE_API_KEY,
    }
    
    if location:
        params["location"] = location
    if radius:
        params["radius"] = radius
        
    try:
        logger.info(f"Searching Google Places for query: '{query}'")
        async with httpx.AsyncClient() as client:
            # Setting a 10s timeout to handle hanging responses smoothly
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            
            data = response.json()
            if data.get("status") != "OK" and data.get("status") != "ZERO_RESULTS":
                logger.warning(f"Google API returned non-OK status: {data.get('status')} - {data.get('error_message')}")
                
            return data
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error occurred while searching places: {e.response.status_code}")
        return {"status": "UNKNOWN_ERROR", "results": [], "error": f"HTTP {e.response.status_code}"}
    except httpx.TimeoutException:
        logger.error("Timeout occurred while searching Google Places API.")
        return {"status": "UNKNOWN_ERROR", "results": [], "error": "Timeout"}
    except Exception as e:
        logger.error(f"An unexpected error occurred: {str(e)}")
        return {"status": "UNKNOWN_ERROR", "results": [], "error": str(e)}


async def get_place_details(place_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific place using its Google Place ID.
    
    Args:
        place_id: A textual identifier that uniquely identifies a place, returned from a Place Search.
        
    Returns:
        JSON response from Google Places Details API.
        Returns empty dict on error.
    """
    if not GOOGLE_PLACE_API_KEY:
        logger.error("GOOGLE_PLACE_API is not set in environment variables.")
        return {"status": "REQUEST_DENIED", "result": {}, "error": "API key not configured."}

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    
    params = {
        "place_id": place_id,
        "key": GOOGLE_PLACE_API_KEY,
    }
    
    try:
        logger.info(f"Fetching details for Google Place ID: {place_id}")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            
            data = response.json()
            if data.get("status") != "OK":
                logger.warning(f"Google API returned non-OK status: {data.get('status')} - {data.get('error_message')}")
                
            return data
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error occurred while fetching place details: {e.response.status_code}")
        return {"status": "UNKNOWN_ERROR", "result": {}, "error": f"HTTP {e.response.status_code}"}
    except httpx.TimeoutException:
        logger.error(f"Timeout occurred while fetching details for place_id: {place_id}.")
        return {"status": "UNKNOWN_ERROR", "result": {}, "error": "Timeout"}
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching details: {str(e)}")
        return {"status": "UNKNOWN_ERROR", "result": {}, "error": str(e)}


async def get_place_photos(place_id: str, max_width: int = 400) -> List[str]:
    """
    Get a list of photo URLs for a specific place using its Google Place ID.
    
    Args:
        place_id: A textual identifier that uniquely identifies a place.
        max_width: The maximum desired width, in pixels, of the image.
        
    Returns:
        A list of URLs pointing to the photos of the place. Returns empty list on errors.
    """
    try:
        # Fetch place details to get the photo references
        details = await get_place_details(place_id)
        
        # Details function handles its own errors and logs them. 
        # Check if the fetch was completely unsuccessful
        if details.get("status") != "OK":
            logger.warning(f"Could not load photos because details fetch failed: {details.get('status')}")
            return []

        photo_urls = []
        result = details.get("result", {})
        photos = result.get("photos", [])
        
        if not photos:
            logger.info(f"No photos available for place_id: {place_id}")
            return []
            
        photo_url_base = "https://maps.googleapis.com/maps/api/place/photo"
        for photo in photos:
            photo_ref = photo.get("photo_reference")
            if photo_ref:
                url = f"{photo_url_base}?maxwidth={max_width}&photo_reference={photo_ref}&key={GOOGLE_PLACE_API_KEY}"
                photo_urls.append(url)
                
        logger.info(f"Successfully generated {len(photo_urls)} photo URLs for place_id: {place_id}")
        return photo_urls
        
    except Exception as e:
        logger.error(f"An unexpected error occurred while processing photos for place_id {place_id}: {str(e)}")
        return []
