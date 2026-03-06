import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from app.services.llm_planning_service import LLMPlanningService, TripProfileRequest, ActivityPattern
from app.services.llm_scheduling_service import LLMSchedulingService, DailySchedule
from app.services.places_service import search_places

logger = logging.getLogger(__name__)

class GenerationOrchestrator:
    def __init__(self):
        self.planning_service = LLMPlanningService()
        self.scheduling_service = LLMSchedulingService()

    async def _fetch_places_for_queries(self, queries: list[str], destination: str) -> list[dict]:
        """
        Calls Google Places API for each specific query extracted by LLM Call 1.
        """
        all_places = []
        
        # In a real heavy-load scenario, we might use asyncio.gather here.
        # However, for rate limiting safety on free tiers, sequential or chunked is safer.
        for query in queries:
            logger.info(f"Orchestrator: Fetching places for '{query}'")
            
            result = await search_places(query=query)
            if result.get("status") == "OK":
                raw_results = result.get("results", [])
                
                # Filter down to the exact data we need to save LLM context tokens (Heuristics Layer)
                for p in raw_results[:5]: # Take top 5 per category
                    mapped_place = {
                        "name": p.get("name"),
                        "place_id": p.get("place_id"),
                        "rating": p.get("rating"),
                        "user_ratings_total": p.get("user_ratings_total"),
                        "types": p.get("types"),
                        "price_level": p.get("price_level"),
                    }
                    all_places.append(mapped_place)
        
        return all_places

    async def generate_full_itinerary(
        self, 
        destination: str, 
        start_date: str, 
        duration_days: int, 
        trip_request: TripProfileRequest
    ) -> Dict[str, Any]:
        """
        The Master Flow: Ties Call 1 (Thematic Planner), APIs, and iterative Call 2s together.
        """
        logger.info(f"Starting generation for {destination} ({duration_days} days)")
        
        # Ensure the request has the correct duration populated
        trip_request.duration_days = duration_days
        
        # 1. LLM CALL 1: The Thematic Profiler
        logger.info("Executing LLM Call 1 (Thematic Profiler)...")
        profile: ActivityPattern = await self.planning_service.extract_activity_pattern(trip_request)
        
        # 2. ITERATIVE LLM CALL 2: The Passive Scheduler
        logger.info("Executing Iterative LLM Call 2 (Scheduler)...")
        daily_schedules = []
        target_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        
        for day in range(1, duration_days + 1):
            
            # Find the assigned theme for this specific day
            day_theme_obj = next((dt for dt in profile.daily_themes if dt.day_number == day), None)
            
            if not day_theme_obj:
                logger.warning(f"No specific theme found for day {day}, falling back to general.")
                day_theme_str = "General Exploration"
                day_queries = [f"top attractions in {destination}"]
            else:
                day_theme_str = day_theme_obj.theme
                day_queries = day_theme_obj.search_queries
                
            # Fetch ONLY the places needed for this specific day's theme
            logger.info(f"Day {day}: Fetching places for theme '{day_theme_str}' -> {day_queries}")
            day_place_candidates = await self._fetch_places_for_queries(day_queries, destination)
            
            await asyncio.sleep(3)
            
            schedule: DailySchedule = await self.scheduling_service.generate_day_schedule(
                day_number=day,
                destination_city=destination,
                profile_rules=profile.model_dump(),
                day_theme=day_theme_str,
                place_candidates=day_place_candidates
            )
            daily_schedules.append(schedule.model_dump())
            
        logger.info("Orchestration complete.")
        
        return {
            "destination": destination,
            "start_date": start_date,
            "duration_days": duration_days,
            "profile_applied": profile.model_dump(),
            "itinerary": daily_schedules
        }
