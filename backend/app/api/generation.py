from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging
from datetime import datetime

from app.services.generation_orchestrator import GenerationOrchestrator
from app.services.llm_planning_service import TripProfileRequest

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency for our Orchestrator to make testing easier
def get_orchestrator() -> GenerationOrchestrator:
    return GenerationOrchestrator()

class GenerateItineraryRequest(TripProfileRequest):
    """
    Inherits all fields from TripProfileRequest:
    destination, origin, month, duration_days, purpose, budget, interests
    
    start_date is derived from month (first day of that month in the current/next year).
    """
    pass

def _derive_start_date(month: str) -> str:
    """Convert a month name (e.g., 'June') to a YYYY-MM-DD start date."""
    now = datetime.now()
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    month_idx = month_names.index(month) + 1  # 1-indexed
    
    # If the month has already passed this year, use next year
    year = now.year if month_idx >= now.month else now.year + 1
    
    return f"{year}-{month_idx:02d}-01"

@router.post("/generate")
async def generate_itinerary(
    request: GenerateItineraryRequest, 
    orchestrator: GenerationOrchestrator = Depends(get_orchestrator)
):
    """
    Generate a complete day-by-day travel itinerary based on user preferences.
    Integrates multiple LLM calls and Google Places.
    """
    start_date = _derive_start_date(request.month)
    logger.info(f"Received API request to generate itinerary for {request.destination} ({request.duration_days} days, {request.month} → {start_date})")
    
    try:
        itinerary_result = await orchestrator.generate_full_itinerary(
            trip_request=request,
            start_date=start_date,
        )
        return itinerary_result
        
    except ValueError as e:
        logger.error(f"Invalid input: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during itinerary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
