import os
import asyncio
import json
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)

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
    
    request = TripProfileRequest(
        destination="Chicago, IL",
        origin="New York",
        month="June",
        duration_days=3,
        purpose="romantic architectural tour, slow mornings with great coffee",
        budget="comfort",
        interests=["culture", "food", "history"]
    )
    
    start_date = "2026-06-01"
    
    print(f"Testing City: {request.destination} for {request.duration_days} days ({request.month})")
    print(f"Origin: {request.origin}")
    print(f"Budget: {request.budget}")
    print(f"Profile: {request.purpose} | {request.interests}\n")
    
    try:
        final_itinerary = await orchestrator.generate_full_itinerary(
            trip_request=request,
            start_date=start_date,
        )
        
        print("\n=== FINAL RESULT ===")
        print(json.dumps(final_itinerary, indent=2))
        
        print("\nSuccess! The itinerary matched the expected structure.")
        
    except Exception as e:
        print(f"\nError during Orchestrator run: {e}")

if __name__ == "__main__":
    asyncio.run(main())
