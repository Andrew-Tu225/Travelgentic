"""
Trip repository — DB access and ORM→API dict mapping for trip/itinerary endpoints.
"""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Trip, ItineraryDate, Activity, TripStatus


def trip_to_list_item_dict(t: Trip) -> dict:
    """Shape for GET /trips list response."""
    return {
        "id": str(t.id),
        "destination": t.destination,
        "month": t.month,
        "duration_days": t.duration_days,
        "budget": t.budget,
        "trip_vibe": t.trip_vibe,
        "city_image_url": t.city_image_url,
        "status": t.status.value if t.status else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


async def list_all_trips(db: AsyncSession) -> list[Trip]:
    trips_result = await db.execute(
        select(Trip).order_by(Trip.created_at.desc())
    )
    return list(trips_result.scalars().all())


async def get_trip_with_itinerary(
    db: AsyncSession,
    trip_id: str,
) -> Trip | None:
    stmt = (
        select(Trip)
        .where(Trip.id == trip_id)
        .options(
            selectinload(Trip.itinerary_dates).selectinload(ItineraryDate.activities)
        )
    )
    trip_result = await db.execute(stmt)
    return trip_result.scalar_one_or_none()


def format_trip_response(trip: Trip) -> dict:
    """Build the same dict shape as GET /trips/{id} and chatbot trip context."""
    sorted_dates = sorted(trip.itinerary_dates, key=lambda d: d.day_number)
    itinerary = []
    for d in sorted_dates:
        activities = [
            {
                "place_name": a.place_name,
                "place_id": a.place_id,
                "category_tag": a.category_tag.value if a.category_tag else None,
                "time_window": a.time_window,
                "estimated_cost_usd": a.estimated_cost_usd,
                "description": a.description,
            }
            for a in d.activities
        ]
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
        "city_image_url": trip.city_image_url,
        "itinerary": itinerary,
    }


async def persist_generated_itinerary(
    db: AsyncSession,
    itinerary_result: dict,
) -> Trip:
    """
    Persist a newly generated itinerary: Trip, ItineraryDates, Activities, and commit.
    """
    trip = Trip(
        destination=itinerary_result["destination"],
        origin=itinerary_result.get("origin"),
        month=itinerary_result.get("month"),
        start_date=datetime.strptime(itinerary_result["start_date"], "%Y-%m-%d").date(),
        duration_days=itinerary_result["duration_days"],
        budget=itinerary_result.get("budget"),
        trip_vibe=itinerary_result.get("trip_vibe"),
        city_image_url=itinerary_result.get("city_image_url"),
        status=TripStatus.ready,
    )
    db.add(trip)
    await db.flush()

    for day_data in itinerary_result.get("itinerary", []):
        itinerary_date = ItineraryDate(
            trip_id=trip.id,
            day_number=day_data["day_number"],
            theme=day_data.get("theme"),
        )
        db.add(itinerary_date)
        await db.flush()

        for i, act_data in enumerate(day_data.get("activities", [])):
            activity = Activity(
                itinerary_date_id=itinerary_date.id,
                place_name=act_data["place_name"],
                place_id=act_data.get("place_id"),
                category_tag=act_data.get("category_tag"),
                time_window=act_data.get("time_window"),
                estimated_cost_usd=act_data.get("estimated_cost_usd"),
                description=act_data.get("description"),
                sort_order=i,
            )
            db.add(activity)

    await db.commit()
    return trip
