import uuid
import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Text, Date, DateTime,
    ForeignKey, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


# ── Enums ──────────────────────────────────────────────

class BudgetTier(str, enum.Enum):
    budget = "budget"
    mid = "mid"
    comfort = "comfort"
    luxury = "luxury"

class TripStatus(str, enum.Enum):
    generating = "generating"
    ready = "ready"
    error = "error"

class CategoryTag(str, enum.Enum):
    food = "food"
    nature = "nature"
    culture = "culture"
    nightlife = "nightlife"
    adventure = "adventure"
    wellness = "wellness"


# ── Models ─────────────────────────────────────────────

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination = Column(String(255), nullable=False)
    origin = Column(String(255), nullable=True)
    month = Column(String(20), nullable=True)
    start_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False)
    budget = Column(String(20), nullable=True)
    trip_vibe = Column(Text, nullable=True)
    city_image_url = Column(Text, nullable=True)
    share_token = Column(String(12), unique=True, nullable=True)
    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.generating)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    itinerary_dates = relationship("ItineraryDate", back_populates="trip", cascade="all, delete-orphan")


class ItineraryDate(Base):
    __tablename__ = "itinerary_dates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    theme = Column(String(255), nullable=True)

    trip = relationship("Trip", back_populates="itinerary_dates")
    activities = relationship(
        "Activity",
        back_populates="itinerary_date",
        cascade="all, delete-orphan",
        order_by="Activity.sort_order",
    )


class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    itinerary_date_id = Column(UUID(as_uuid=True), ForeignKey("itinerary_dates.id"), nullable=False)
    place_name = Column(String(255), nullable=False)
    place_id = Column(String(100), nullable=True)
    category_tag = Column(Enum(CategoryTag), nullable=True)
    time_window = Column(String(20), nullable=True)
    estimated_cost_usd = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    itinerary_date = relationship("ItineraryDate", back_populates="activities")
