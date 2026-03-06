from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging

from app.services.generation_orchestrator import GenerationOrchestrator
from app.services.llm_planning_service import TripProfileRequest

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency for our Orchestrator to make testing easier
def get_orchestrator() -> GenerationOrchestrator:
    return GenerationOrchestrator()

# Inherit from TripProfileRequest to flatten the payload
class GenerateItineraryRequest(TripProfileRequest):
    start_date: str = Field(description="The start date of the trip in YYYY-MM-DD format")

@router.post("/generate")
async def generate_itinerary(
    request: GenerateItineraryRequest, 
    orchestrator: GenerationOrchestrator = Depends(get_orchestrator)
):
    """
    Generate a complete day-by-day travel itinerary based on user preferences.
    Integrates multiple LLM calls and Google Places.
    """
    logger.info(f"Received API request to generate itinerary for {request.destination} ({request.duration_days} days starting {request.start_date})")
    
    try:
        # Pass the request directly as the trip_profile since it inherits from it
        itinerary_result = await orchestrator.generate_full_itinerary(
            destination=request.destination,
            start_date=request.start_date,
            duration_days=request.duration_days,
            trip_request=request
        )
        return itinerary_result
        
    except Exception as e:
        logger.error(f"Error during itinerary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
