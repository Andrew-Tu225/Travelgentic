import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.generation import router as generation_router
from app.api.users import router as users_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("Starting up Travelgentic API...")
    yield
    # Shutdown logic
    print("Shutting down Travelgentic API...")

app = FastAPI(
    title="Travelgentic API",
    description="API for Travelgentic Phase 1",
    version="0.1.0",
    lifespan=lifespan
)

# CORS – allow the Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generation_router, prefix="/api")
app.include_router(users_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Travelgentic API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
