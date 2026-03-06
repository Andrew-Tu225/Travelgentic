import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class TripProfileRequest(BaseModel):
    destination: str = Field(description="The city or region the user is traveling to (e.g., 'Tokyo', 'Paris')")
    duration_days: int = Field(description="The number of days the trip will last")
    purpose: str = Field(description="Free-text description of the trip's purpose (e.g., 'relaxing honeymoon', 'intense cultural exploration')")
    constraints: str | None = Field(default=None, description="Physical, dietary, or scheduling constraints (e.g., 'bad knee, vegetarian, no early mornings')")
    interests: list[str] = Field(default_factory=list, description="Specific interests (e.g., ['spa', 'fine dining', 'history'])")

class DailyTheme(BaseModel):
    day_number: int = Field(description="The specific day of the trip (e.g., 1, 2, 3)")
    theme: str = Field(description="A concise geographical or thematic focus for this day (e.g., 'Historic Downtown & River Walk')")
    search_queries: list[str] = Field(description="3-5 highly specific Google Places text queries tailored to this day's theme and the overall profile (e.g., 'architecture boat tour Chicago', 'fine dining near river walk')")

class ActivityPattern(BaseModel):
    max_activities_per_day: int = Field(description="Derived from pace preference. Examples: 2 for chill, 4 for moderate, 5+ for fast-paced")
    trip_vibe: str = Field(description="A 2 to 3 sentence paragraph that captures the overall vibe, feel, and thematic purpose of the trip")
    daily_themes: list[DailyTheme] = Field(description="A specific theme and list of tailored search queries for each individual day of the trip")
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
        You are an expert travel profiler and thematic planner. Analyze the user's input to extract pacing rules, 
        and then create a high-level thematic plan for EACH day of their {request.duration_days}-day trip.
        
        Destination: {request.destination}
        Trip Duration: {request.duration_days} days
        Trip Purpose: {request.purpose}
        Constraints: {request.constraints or 'None'}
        Interests: {', '.join(request.interests) if request.interests else 'None'}
        
        Rules for output:
        1. daily_themes: You MUST generate exactly {request.duration_days} daily themes. For each day, provide a cohesive 'theme' (like 'Museum Campus & Jazz') and a list of 'search_queries' that perfectly match the theme, the user's profile, and the destination (e.g., 'art institute chicago', 'intimate jazz club chicago'). Do not use generic categories.
        2. trip_vibe: Provide a 2 to 3 sentence narrative that beautifully captures the exact vibe, feel, and thematic purpose of this trip.
        3. pacing_rules: Describe the pacing context for a scheduler (e.g., 'Must schedule a 1-hour rest at 2 PM'). Use the constraints and purpose to inform this.
        4. max_activities_per_day: Reflect the implied pace (e.g., 4 for chill/relaxed, 5 for moderate, 6+ for fast-paced).
        5. dietary_tags: Extract any food restrictions mentioned.
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
