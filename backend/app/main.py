import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

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

@app.get("/")
async def root():
    return {"message": "Welcome to Travelgentic API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
