import os
import asyncio
import json
import logging
from dotenv import load_dotenv

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)

# Load environment variables from the .env file in the backend directory
load_dotenv()

# Check if the API key is actually loaded, if not, print a helpful message
if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY is not set in your .env file.")
    print("Please add 'GEMINI_API_KEY=your_actual_api_key' to backend/.env and run again.\n")

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.llm_planning_service import LLMPlanningService, TripProfileRequest

async def run_test_scenario(scenario_name: str, destination: str, origin: str, month: str, duration_days: int, purpose: str, budget: str, interests: list[str]):
    print(f"--- Scenario: {scenario_name} in {destination} ({duration_days} days) ---")
    request = TripProfileRequest(
        destination=destination,
        origin=origin,
        month=month,
        duration_days=duration_days,
        purpose=purpose,
        budget=budget,
        interests=interests
    )
    
    print("Input:")
    print(f"  Destination: {request.destination}")
    print(f"  Origin: {request.origin}")
    print(f"  Month: {request.month}")
    print(f"  Purpose: {request.purpose}")
    print(f"  Budget: {request.budget}")
    print(f"  Interests: {request.interests}")
    print("\nCalling Gemini...")

    try:
        service = LLMPlanningService()
        result = await service.extract_activity_pattern(request)
        
        print("\nResult (ActivityPattern):")
        print(json.dumps(result.model_dump(), indent=2))
    except Exception as e:
        print(f"Error during API call: {e}")
    print("-" * 40 + "\n")

async def main():
    print("Starting manual verification for LLM Call 1...\n")
    
    # Scenario 1: The Honeymooners
    await run_test_scenario(
        scenario_name="Relaxed couple getaway",
        destination="Tokyo, Japan",
        origin="Los Angeles",
        month="June",
        duration_days=3,
        purpose="A 3-day relaxing honeymoon full of amazing food and slow mornings",
        budget="luxury",
        interests=["food", "wellness", "culture"]
    )

    # Scenario 2: Budget solo adventure
    await run_test_scenario(
        scenario_name="Fast-paced solo adventure",
        destination="Paris, France",
        origin="New York",
        month="March",
        duration_days=2,
        purpose="Seeing as much history and art as possible in 48 hours",
        budget="budget",
        interests=["culture", "history", "food"]
    )
    
    # Scenario 3: Mid-range group trip
    await run_test_scenario(
        scenario_name="Weekend with friends",
        destination="Las Vegas, NV",
        origin="San Francisco",
        month="October",
        duration_days=2,
        purpose="Bachelor party weekend, nightlife, adventures, we want to see as much as possible",
        budget="mid",
        interests=["nightlife", "adventure", "food"]
    )

if __name__ == "__main__":
    asyncio.run(main())
