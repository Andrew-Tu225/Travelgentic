import os
import asyncio
import json
from dotenv import load_dotenv

# Load environment variables from the .env file in the backend directory
load_dotenv()

# Check if the API key is actually loaded, if not, print a helpful message
if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY is not set in your .env file.")
    print("Please add 'GEMINI_API_KEY=your_actual_api_key' to backend/.env and run again.\n")

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.llm_planning_service import LLMPlanningService, TripProfileRequest

async def run_test_scenario(scenario_name: str, destination: str, duration_days: int, purpose: str, constraints: str | None, interests: list[str]):
    print(f"--- Scenario: {scenario_name} in {destination} ({duration_days} days) ---")
    request = TripProfileRequest(
        destination=destination,
        duration_days=duration_days,
        purpose=purpose,
        constraints=constraints,
        interests=interests
    )
    
    print("Input:")
    print(f"  Destination: {request.destination}")
    print(f"  Purpose: {request.purpose}")
    print(f"  Constraints: {request.constraints}")
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
        duration_days=3,
        purpose="A 3-day relaxing honeymoon full of amazing food",
        constraints="No early mornings, allergic to shellfish",
        interests=["fine dining", "spas", "hidden cocktail bars"]
    )

    await run_test_scenario(
        scenario_name="Fast-paced solo adventure",
        destination="Paris, France",
        duration_days=2,
        purpose="Seeing as much history and art as possible in 48 hours",
        constraints="On a budget, lots of walking is fine",
        interests=["museums", "history", "street food"]
    )
    
    # Scenario 3: The Action-Packed Group (modified to include duration_days)
    await run_test_scenario(
        scenario_name="Intense Weekend Warrior",
        destination="Las Vegas, NV",
        duration_days=2, # Added duration_days
        purpose="Bachelor party weekend, casino, nightlife, we want to see as much as possible",
        constraints="Need a mix of cheap drinks and extreme sports, gluten-free options needed for one guy",
        interests=["nightlife", "adventure", "meat"]
    )

if __name__ == "__main__":
    asyncio.run(main())
