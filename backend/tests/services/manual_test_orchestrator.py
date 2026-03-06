import os
import asyncio
import json
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

load_dotenv()

if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY is not set.")

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.generation_orchestrator import GenerationOrchestrator
from app.services.llm_planning_service import TripProfileRequest

async def main():
    print("Starting full Orchestrator test (LLM 1 -> Google Places -> LLM 2)...\n")
    
    orchestrator = GenerationOrchestrator()
    
    destination = "Chicago, IL"
    start_date = "2026-03-20"
    duration_days = 3
    
    # Let's do a 2-day trip to limit API calls during testing
    request = TripProfileRequest(
        destination=destination,
        duration_days=duration_days,
        purpose="romantic architectural tour",
        constraints="want a relaxed pace, vegetarian",
        interests=["architecture", "museums", "romantic dinners"]
    )
    
    print(f"Testing City: {destination} for {duration_days} days starting {start_date}")
    print(f"Profile: {request.purpose} | {request.constraints} | {request.interests}\n")
    
    try:
        final_itinerary = await orchestrator.generate_full_itinerary(
            destination=destination,
            start_date=start_date,
            duration_days=duration_days,
            trip_request=request
        )
        
        print("\n=== FINAL RESULT ===")
        print(json.dumps(final_itinerary, indent=2))
        
        print("\nSuccess! The itinerary matched the expected structure.")
        
    except Exception as e:
        print(f"\nError during Orchestrator run: {e}")

if __name__ == "__main__":
    asyncio.run(main())
