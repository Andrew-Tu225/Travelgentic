import logging
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.places_service import get_place_photos

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/places/{place_id}/photo")
async def get_place_photo(
    place_id: str,
):
    """
    Securely fetch a photo for a place_id and stream it to the client.
    This prevents exposing the Google Places API key to the frontend.
    """
    try:
        # 1. Ask places_service for photo URLs
        photo_urls = await get_place_photos(place_id, max_width=800)
        
        if not photo_urls:
            raise HTTPException(status_code=404, detail="No photos available for this place")

        # Use the first photo
        target_url = photo_urls[0]

        # 2. Proxy the image
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(target_url, timeout=10.0)
            
            if resp.status_code != 200:
                logger.error(f"Failed to fetch photo from Google: {resp.status_code}")
                raise HTTPException(status_code=502, detail="Failed to fetch upstream photo")

            # 3. Return as a stream/response
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(content=resp.content, media_type=content_type)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving place photo for {place_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
