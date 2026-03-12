from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.services.generation_orchestrator import GenerationOrchestrator
from app.services.llm_planning_service import TripProfileRequest
from app.db.database import get_db
from app.core.clerk_auth import require_clerk_user
from app.models.models import User, Trip, ItineraryDate, Activity, TripStatus

logger = logging.getLogger(__name__)

router = APIRouter()


# Dependency for our Orchestrator
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
    clerk_id: str = Depends(require_clerk_user),
    db: AsyncSession = Depends(get_db),
    orchestrator: GenerationOrchestrator = Depends(get_orchestrator),
):
    """
    Generate a complete day-by-day travel itinerary and persist it to the database.
    """
    start_date = _derive_start_date(request.month)
    logger.info(f"Received API request from {clerk_id} to generate itinerary for {request.destination} ({request.duration_days} days, {request.month} → {start_date})")

    # Look up user
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sync your account first.")

    # Enforce trip limits
    FREE_TIER_LIMIT = 5
    if not user.is_subscribed and user.trips_generated >= FREE_TIER_LIMIT:
        raise HTTPException(
            status_code=403, 
            detail=f"You have reached the free limit of {FREE_TIER_LIMIT} trips. Please subscribe to generate more!"
        )

    try:
        # Generate the itinerary
        itinerary_result = await orchestrator.generate_full_itinerary(
            trip_request=request,
            start_date=start_date,
        )

        # Persist to database
        trip = Trip(
            user_id=user.id,
            destination=itinerary_result["destination"],
            origin=itinerary_result.get("origin"),
            month=itinerary_result.get("month"),
            start_date=datetime.strptime(itinerary_result["start_date"], "%Y-%m-%d").date(),
            duration_days=itinerary_result["duration_days"],
            budget=itinerary_result.get("budget"),
            trip_vibe=itinerary_result.get("trip_vibe"),
            status=TripStatus.ready,
        )
        db.add(trip)
        await db.flush()  # get trip.id

        for day_data in itinerary_result.get("itinerary", []):
            itinerary_date = ItineraryDate(
                trip_id=trip.id,
                day_number=day_data["day_number"],
                theme=day_data.get("theme"),
            )
            db.add(itinerary_date)
            await db.flush()  # get itinerary_date.id

            for act_data in day_data.get("activities", []):
                activity = Activity(
                    itinerary_date_id=itinerary_date.id,
                    place_name=act_data["place_name"],
                    place_id=act_data.get("place_id"),
                    category_tag=act_data.get("category_tag"),
                    time_window=act_data.get("time_window"),
                    estimated_cost_usd=act_data.get("estimated_cost_usd"),
                    description=act_data.get("description"),
                )
                db.add(activity)

        # Increment trips_generated
        user.trips_generated += 1

        await db.commit()
        logger.info(f"Saved trip {trip.id} for user {clerk_id}")

        # Return response with trip_id
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
    clerk_id: str = Depends(require_clerk_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch all trips for the authenticated user, ordered by most recent first.
    """
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    trips_result = await db.execute(
        select(Trip)
        .where(Trip.user_id == user.id)
        .order_by(Trip.created_at.desc())
    )
    trips = trips_result.scalars().all()

    return [
        {
            "id": str(t.id),
            "destination": t.destination,
            "month": t.month,
            "duration_days": t.duration_days,
            "budget": t.budget,
            "trip_vibe": t.trip_vibe,
            "status": t.status.value if t.status else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in trips
    ]


@router.get("/trips/{trip_id}")
async def get_trip_details(
    trip_id: str,
    clerk_id: str = Depends(require_clerk_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch full details of a specific trip, shaped exactly like the /generate response.
    """
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch trip with dates and activities using selectinload
    stmt = (
        select(Trip)
        .where(Trip.id == trip_id, Trip.user_id == user.id)
        .options(
            selectinload(Trip.itinerary_dates)
            .selectinload(ItineraryDate.activities)
        )
    )
    trip_result = await db.execute(stmt)
    trip = trip_result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Sort dates by day_number
    sorted_dates = sorted(trip.itinerary_dates, key=lambda d: d.day_number)

    # Format exactly like /api/generate
    itinerary = []
    for d in sorted_dates:
        # Sort activities by time_window (simplistic string sort works for HH:MM format typically, 
        # but here we just rely on insert order or assume it's roughly sorted)
        # Better: keep original order if possible. Since we don't have sort_order anymore, 
        # we'll just return what's in DB.
        activities = []
        for a in d.activities:
            activities.append({
                "place_name": a.place_name,
                "place_id": a.place_id,
                "category_tag": a.category_tag.value if a.category_tag else None,
                "time_window": a.time_window,
                "estimated_cost_usd": a.estimated_cost_usd,
                "description": a.description,
            })
        
        itinerary.append({
            "day_number": d.day_number,
            "theme": d.theme,
            "activities": activities,
        })

    return {
        "trip_id": str(trip.id),
        "destination": trip.destination,
        "origin": trip.origin,
        "month": trip.month,
        "start_date": trip.start_date.isoformat() if trip.start_date else None,
        "duration_days": trip.duration_days,
        "budget": trip.budget,
        "trip_vibe": trip.trip_vibe,
        "itinerary": itinerary,
    }
