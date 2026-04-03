# Travelgentic

### Landing

![Landing — Travel Your Way](docs/readme/hero.png)

### Plan your trip

![Onboarding — destination, origin, month, and duration](docs/readme/plan-trip.png)

### Your journey & Travel Assistant

![Day-by-day itinerary, smart checklist, and chat to refine the trip](docs/readme/itinerary-assistant.png)

**Travelgentic** is an AI-powered travel planning app. You describe where you want to go, when, and what matters to you; the system builds a day-by-day itinerary with real places, times, and summaries. After generation, a **Travel Assistant** chatbot helps you refine the plan—explain stops, add or remove activities, or rebalance a busy day—while changes are saved to your trip.

---

## How it builds your trip (backend)

Trip generation is orchestrated on the **FastAPI** backend (`GenerationOrchestrator`):

1. **Gemini — planning (LLM call 1)**  
   From your profile (destination, origin, month, duration, purpose, budget, interests), the **LLM planning service** produces structured output: daily themes, pacing rules, budget-aware guidance, and targeted **Google Places** search queries per day.

2. **Google Places API**  
   For each day’s queries, the backend calls the Places API to fetch real venues (names, ratings, `place_id`, etc.) so the schedule is grounded in actual locations.

3. **Gemini — scheduling (LLM call 2, per day)**  
   The **LLM scheduling service** turns those candidates into a chronological day plan: time windows, short descriptions, category tags, and cost bands—only using places from the fetched list.

The result is persisted (PostgreSQL via SQLAlchemy) and returned to the frontend.

---

## Travel Assistant (chatbot)

The **chatbot** runs on **`POST /api/trips/{trip_id}/chat`**. A **Gemini** agent (`run_chatbot_agent`) receives your trip context and current itinerary, uses **tool calling** (e.g. search places, update itinerary) to apply changes, and returns a short reply plus the **updated itinerary**, which is written back to the database. Pure questions can be answered without changing the schedule.

---

## Repository layout

```
Travelgentic/
├── backend/                 # FastAPI API, orchestration, LLM & Places services
│   ├── app/
│   │   ├── api/             # HTTP routes (generation, trips, chat, places)
│   │   ├── db/              # Async SQLAlchemy + session
│   │   ├── models/          # ORM models
│   │   ├── repositories/    # Trip / itinerary persistence
│   │   └── services/        # Orchestrator, LLM, Places, chatbot agent & tools
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js App Router UI
│   ├── src/
│   │   ├── app/             # Pages (landing, dashboard, trip view)
│   │   ├── components/      # Landing, onboarding, trip UI, etc.
│   │   └── lib/             # API client helpers
│   └── package.json
├── docs/                    # Extra docs and README assets
└── docker-compose.yml       # Optional backend container (loads backend/.env)
```

---

## Environment

Create **two** local env files (they are gitignored). Never commit real secrets.

### Backend — `backend/.env`

| Variable | Purpose |
| -------- | ------- |
| `GEMINI_API_KEY` | Google AI (Gemini) for planning, scheduling, and the chatbot agent |
| `GOOGLE_PLACE_API` | Google Places API key (enable Places / relevant APIs in Google Cloud) |
| `SUPABASE_DATABASE_URL` | Async PostgreSQL URL for SQLAlchemy (e.g. Supabase connection string) |

```env
GEMINI_API_KEY=your_gemini_key
GOOGLE_PLACE_API=your_google_places_key
SUPABASE_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
```

### Frontend — `frontend/.env.local`

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_API_URL` | Optional. Defaults to `http://localhost:8000` if unset; set this if your API runs on another host/port |

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## How to run

**Prerequisites:** Python 3.11+, Node.js 18+, a PostgreSQL database reachable via `SUPABASE_DATABASE_URL`, and API keys as above.

### 1. Database

Apply migrations from the backend directory (with your venv activated and `backend/.env` loaded):

```bash
cd backend
alembic upgrade head
```

### 2. Backend API

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API serves at `http://localhost:8000` (health: `GET /health`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Ensure the backend CORS settings match your frontend origin (defaults expect `http://localhost:3000`).

### Optional: Docker for the API only

From the repo root:

```bash
docker compose up --build
```

This builds and runs the backend container with `backend/.env`; you still need the database reachable and migrations applied as appropriate for your setup.

---

## License

This project is **open source** and licensed under the [MIT License](LICENSE). You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the conditions in that file.
