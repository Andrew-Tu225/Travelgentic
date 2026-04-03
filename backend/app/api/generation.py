from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.generation_orchestrator import GenerationOrchestrator
from app.services.llm_planning_service import TripProfileRequest
from app.services.chatbot.service import process_chat_message
from app.db.database import get_db
from app.repositories import trip_repository

logger = logging.getLogger(__name__)

router = APIRouter()


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
    db: AsyncSession = Depends(get_db),
    orchestrator: GenerationOrchestrator = Depends(get_orchestrator),
):
    """
    Generate a complete day-by-day travel itinerary and persist it to the database.
    """
    start_date = _derive_start_date(request.month)
    logger.info(
        f"Received API request to generate itinerary for {request.destination} "
        f"({request.duration_days} days, {request.month} → {start_date})"
    )

    try:
        itinerary_result = await orchestrator.generate_full_itinerary(
            trip_request=request,
            start_date=start_date,
        )

        trip = await trip_repository.persist_generated_itinerary(db, itinerary_result)
        logger.info(f"Saved trip {trip.id}")

        itinerary_result["trip_id"] = str(trip.id)
        return itinerary_result

    except ValueError as e:
        logger.error(f"Invalid input: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during itinerary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trips")
async def list_trips(
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all trips, ordered by most recent first.
    """
    trips = await trip_repository.list_all_trips(db)
    return [trip_repository.trip_to_list_item_dict(t) for t in trips]


@router.get("/trips/{trip_id}")
async def get_trip_details(
    trip_id: str,
    db=Depends(get_db),
):
    """
    Fetch full details of a specific trip, shaped exactly like the /generate response.
    """
    trip = await trip_repository.get_trip_with_itinerary(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return trip_repository.format_trip_response(trip)


class ChatbotRequest(BaseModel):
    """Body for POST /trips/{trip_id}/chat."""
    message: str = Field(..., min_length=1, description="User message for the itinerary chatbot.")


@router.post("/trips/{trip_id}/chat")
async def trip_chat(
    trip_id: str,
    body: ChatbotRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the itinerary chatbot. The agent can answer questions and
    apply changes (add/remove/modify activities). Returns a short reply and
    the updated itinerary; changes are persisted.
    """
    trip = await trip_repository.get_trip_with_itinerary(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip_dict = trip_repository.format_trip_response(trip)

    try:
        result = await process_chat_message(
            trip, trip_dict, body.message.strip(), db
        )
    except Exception:
        logger.exception("Chatbot agent error for trip %s", trip_id)
        raise HTTPException(status_code=500, detail="Chatbot failed. Please try again.")

    return {"message": result["message"], "itinerary": result["itinerary"]}
