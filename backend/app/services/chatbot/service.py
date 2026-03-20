"""
Chatbot service — owns agent orchestration and persistence.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Trip
from app.services.chatbot.agent import run_chatbot_agent
from app.repositories.itinerary_repository import upsert_itinerary


async def process_chat_message(
    trip: Trip,
    trip_dict: dict,
    user_message: str,
    db: AsyncSession,
) -> dict:
    """
    Run the chatbot agent and persist the updated itinerary.

    Returns:
        {"message": str, "itinerary": list} — agent result
    """
    agent_result = await run_chatbot_agent(
        trip=trip_dict,
        itinerary=trip_dict["itinerary"],
        user_message=user_message,
    )
    await upsert_itinerary(db, trip, agent_result["itinerary"])
    return agent_result
