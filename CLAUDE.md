# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travelgentic is an AI-powered travel planning app. Users input a destination and preferences; the backend orchestrates two Gemini LLM calls + Google Places API lookups to generate a day-by-day itinerary, which users can then refine via a chatbot. No authentication is required — all routes are open.

## Repository Structure

Monorepo with two independent deployable packages:
- `frontend/` — Next.js 16 App Router (React 19, Tailwind CSS v4)
- `backend/` — FastAPI Python (SQLAlchemy async, PostgreSQL via Supabase, Gemini API)

## Commands

### Frontend (`frontend/`)
```bash
npm run dev      # Dev server on port 3000
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (`backend/`)
```bash
# Activate venv first, then from backend/:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Dev server
pytest                   # Run tests
pytest -v                # Verbose tests

# Database migrations:
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Docker
```bash
docker compose up --build   # Build and run backend container
```

## Environment Variables

**`backend/.env`**
```
GEMINI_API_KEY=
GOOGLE_PLACE_API=
SUPABASE_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Architecture

### Trip Generation Flow

The core feature lives in `backend/app/services/`:

1. `POST /api/generate` — receives trip params (destination, dates, interests, budget)
2. `llm_planning_service.py` — **Gemini Call 1**: produces daily themes + search queries per day
3. `places_service.py` — fetches top 5 Google Places results per query (3-second delay between days for free-tier rate limiting)
4. `llm_scheduling_service.py` — **Gemini Call 2** (per day): schedules actual fetched places into a chronological itinerary
5. `generation_orchestrator.py` — coordinates the above pipeline
6. `trip_repository.py` — persists to DB

### Chatbot Flow

`POST /api/trips/{trip_id}/chat` → `services/chatbot/agent.py` runs a Gemini tool-calling agent. Tools in `chatbot/tools.py` can search places and add/remove/modify activities in the trip. Changes are persisted immediately.

### Database Schema

```
Trip (destination, month, duration_days, budget, trip_vibe, city_image_url, status)
└── ItineraryDate (day_number, theme)
    └── Activity (place_name, place_id, category_tag, time_window, estimated_cost_usd, description, sort_order)
```

### Frontend Page Structure

```
/ → landing page
/dashboard → list all trips
/generate → onboarding flow (StepOne → StepTwo → GenerationFlow component)
/trip/[id] → itinerary view + TripChatbot component
/trip/loading → loading state during generation
```

Frontend calls the backend via `src/lib/api.js`. Path alias `@/*` maps to `src/*`.

## Key Architectural Decisions

- **No authentication** — all API endpoints and frontend routes are open; no login required
- **No internal POI database** — all place data is fetched live from Google Places API
- **Free tier rate limiting** — 3-second delays between daily Places API calls
- **LLM grounding** — scheduling LLM only receives actual Places API results (not hallucinated venues)
- **Deployment** — frontend on Vercel (Next.js); backend on Vercel serverless via `backend/vercel.json` mapping to `app/main.py`
