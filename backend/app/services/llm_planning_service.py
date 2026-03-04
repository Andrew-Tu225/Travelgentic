import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class TripProfileRequest(BaseModel):
    purpose: str = Field(description="Free-text description of the trip's purpose (e.g., 'relaxing honeymoon', 'intense cultural exploration')")
    constraints: str | None = Field(default=None, description="Physical, dietary, or scheduling constraints (e.g., 'bad knee, vegetarian, no early mornings')")
    interests: list[str] = Field(default_factory=list, description="Specific interests (e.g., ['spa', 'fine dining', 'history'])")

class ActivityPattern(BaseModel):
    max_activities_per_day: int = Field(description="Derived from pace preference. Examples: 2 for chill, 4 for moderate, 5+ for fast-paced")
    search_categories: list[str] = Field(description="List of valid Google Places API types (e.g., 'restaurant', 'museum', 'park', 'spa', 'cafe', 'amusement_park')")
    dietary_tags: list[str] = Field(description="List of food/dietary restrictions parsed from constraints")
    pacing_rules: str = Field(description="Contextual rules for scheduling, e.g., 'Must schedule a 2-hour rest at 2 PM' or 'No early mornings'")

class LLMPlanningService:
    def __init__(self, api_key: str | None = None):
        """
        Initialize the Gemini planning service. 
        Will fallback to the GEMINI_API_KEY environment variable if api_key is not provided.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment.")
        self.client = genai.Client(api_key=self.api_key)

    async def extract_activity_pattern(self, request: TripProfileRequest) -> ActivityPattern:
        """
        LLM Call 1: The Profiler.
        Uses Gemini to extract structured planning parameters from free-text user input.
        This provides the strict rules and context needed for the itinerary generation (LLM Call 2).
        """
        prompt = f"""
        You are an expert travel profiler. Extract the pacing rules, maximum activities per day, 
        and specific Google Places API 'type' categories from the user's input.
        
        Trip Purpose: {request.purpose}
        Constraints: {request.constraints or 'None'}
        Interests: {', '.join(request.interests) if request.interests else 'None'}
        
        Rules for output:
        1. search_categories should be a list of valid Google Places types that perfectly match the user's interests and purpose and constraints (e.g., 'restaurant', 'museum', 'park', 'spa', 'cafe').
        2. pacing_rules should describe the pacing context for a scheduler (e.g., 'Must schedule a 2-hour rest at 2 PM'). Use the constraints and purpose to inform this.
        3. max_activities_per_day should reflect the implied pace (e.g., 2 for chill/relaxed, 4 for moderate, 5+ for fast-paced).
        4. dietary_tags should extract any food restrictions mentioned.
        """
        
        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ActivityPattern,
                temperature=0.1, # Keep it deterministic for parameter extraction
            ),
        )
        
        # Parse the structured JSON output directly into our ActivityPattern schema
        return ActivityPattern.model_validate_json(response.text)
