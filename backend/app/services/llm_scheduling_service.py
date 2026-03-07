import os
import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class Activity(BaseModel):
    place_name: str = Field(description="Display name from Google Places")
    description: str = Field(description="1-2 sentence LLM-generated summary tailored to trip purpose")
    category_tag: str = Field(description="One of: food / nature / culture / nightlife / adventure / wellness")
    time_window: str = Field(description="e.g., '10:00–12:00' - respects wake/sleep prefs and pace")
    estimated_cost_usd: str = Field(description="Per-person activity cost band: free / $1-20 / $20-60 / $60+")
    place_id: str = Field(description="Google Places ID for linking and future booking integration")

class DailySchedule(BaseModel):
    day_number: int = Field(description="Which day of the trip this is (e.g., 1)")
    theme: str = Field(description="A short theme for this geographical cluster (e.g., 'Historic Downtown Exploration')")
    activities: list[Activity] = Field(description="Chronological list of activities for this day")

class LLMSchedulingService:
    def __init__(self, api_key: str | None = None):
        """
        Initialize the Gemini scheduling service for LLM Call 2.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment.")
        self.client = genai.Client(api_key=self.api_key)

    async def generate_day_schedule(
        self,
        day_number: int,
        destination_city: str,
        profile_rules: dict,
        day_theme: str,
        place_candidates: list[dict]
    ) -> DailySchedule:
        """
        LLM Call 2: The Passive Scheduler.
        Runs once per day of the trip. Receives a specific theme and specific
        search results gathered by the orchestrator based on Call 1's queries.
        """
        
        # Ensure we don't accidentally blow up context window by forcing a trim of the candidates
        safe_candidates = json.dumps(place_candidates[:15], indent=2)
        safe_rules = json.dumps(profile_rules, indent=2)

        prompt = f"""
        You are an expert local travel guide in {destination_city}. 
        Create a realistic, chronological daily itinerary for Day {day_number} of the trip.
        
        DAY'S THEME: {day_theme}
        
        You MUST strictly follow these profile rules for pacing and budget:
        {safe_rules}
        
        Here are the specific available places fetched for this exact day (choose the best ones that fit the profile and theme):
        {safe_candidates}
        
        Rules:
        1. Select places ONLY from the provided place_candidates list. Use their exact names and place_ids.
        2. Create realistic time_windows (e.g., "10:00-12:00"). Account for actual time needed at a place.
        3. Respect the max_activities_per_day defined in the profile rules.
        4. The theme should reflect the DAY'S THEME.
        5. Provide a 1-2 sentence description tailored to the traveler's purpose.
        6. Respect the budget_context — select places and estimate costs that match the traveler's budget tier.
        """
        
        logger.info(f"Generating schedule for Day {day_number} ({day_theme})....")
        
        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DailySchedule,
                temperature=0.4, # Slight creativity for the descriptions
            ),
        )
        
        return DailySchedule.model_validate_json(response.text)
