"""
Itinerary repository — owns all DB logic for itinerary upsert.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Trip, ItineraryDate, Activity, CategoryTag


async def upsert_itinerary(
    db: AsyncSession,
    trip: Trip,
    updated_itinerary: list[dict],
) -> None:
    """
    Diff-based upsert: delete only removed activities/dates, update or insert the rest.
    Preserves activity IDs when possible.
    """
    agent_place_ids = {
        act["place_id"]
        for day in updated_itinerary
        for act in day.get("activities", [])
        if act.get("place_id")
    }
    agent_days = {d["day_number"] for d in updated_itinerary}

    existing_by_place_id = {
        act.place_id: act
        for idate in trip.itinerary_dates
        for act in idate.activities
        if act.place_id
    }

    existing_dates_by_day = {idate.day_number: idate for idate in trip.itinerary_dates}

    # Delete activities no longer in agent result (no flush needed — nothing reads from this)
    for place_id, act in list(existing_by_place_id.items()):
        if place_id not in agent_place_ids:
            await db.delete(act)

    # Create/keep ItineraryDates; collect idates to delete (removed or theme-changed)
    idate_by_day: dict[int, ItineraryDate] = {}
    idates_to_delete: list[ItineraryDate] = [
        idate for day_num, idate in existing_dates_by_day.items()
        if day_num not in agent_days
    ]
    for day_data in updated_itinerary:
        day_number = day_data["day_number"]
        theme = day_data.get("theme")
        existing = existing_dates_by_day.get(day_number)
        if existing and existing.theme == theme:
            idate_by_day[day_number] = existing
        else:
            if existing:
                idates_to_delete.append(existing)
            new_idate = ItineraryDate(trip_id=trip.id, day_number=day_number, theme=theme)
            db.add(new_idate)
            await db.flush()  # new_idate.id needed for Activity.itinerary_date_id
            idate_by_day[day_number] = new_idate

    # Upsert activities per day (reassigns itinerary_date_id for theme-changed days, moving activities)
    for day_data in updated_itinerary:
        itinerary_date = idate_by_day[day_data["day_number"]]
        for i, act_data in enumerate(day_data.get("activities", [])):
            raw_tag = act_data.get("category_tag")
            try:
                category_tag = CategoryTag(raw_tag) if raw_tag else None
            except (ValueError, TypeError):
                category_tag = None

            place_id = act_data.get("place_id")
            existing_act = existing_by_place_id.get(place_id) if place_id else None

            if existing_act:
                existing_act.place_name = act_data.get("place_name", "Unknown")
                existing_act.time_window = act_data.get("time_window")
                existing_act.description = act_data.get("description")
                existing_act.estimated_cost_usd = act_data.get("estimated_cost_usd")
                existing_act.category_tag = category_tag
                existing_act.itinerary_date_id = itinerary_date.id
                existing_act.sort_order = i
                existing_by_place_id.pop(place_id, None)
            else:
                activity = Activity(
                    itinerary_date_id=itinerary_date.id,
                    place_name=act_data.get("place_name", "Unknown"),
                    place_id=place_id,
                    category_tag=category_tag,
                    time_window=act_data.get("time_window"),
                    estimated_cost_usd=act_data.get("estimated_cost_usd"),
                    description=act_data.get("description"),
                    sort_order=i,
                )
                db.add(activity)

    # Delete old ItineraryDates (theme-changed or removed); activities already moved in upsert
    for idate in idates_to_delete:
        await db.delete(idate)

    await db.commit()
