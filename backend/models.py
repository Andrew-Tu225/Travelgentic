import uuid
import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Text, Date, DateTime,
    ForeignKey, Enum, JSON
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from database import Base


# ── Enums ──────────────────────────────────────────────

class BudgetTier(str, enum.Enum):
    budget = "budget"
    mid_range = "mid-range"
    luxury = "luxury"

class PacePreference(str, enum.Enum):
    slow = "slow"
    moderate = "moderate"
    fast_paced = "fast-paced"

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

class CostBand(str, enum.Enum):
    free = "free"
    low = "$1-20"
    mid = "$20-60"
    high = "$60+"


# ── Models ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    trips = relationship("Trip", back_populates="user")


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    origin_city = Column(String(255), nullable=True)
    budget_tier = Column(Enum(BudgetTier), nullable=True)
    interests = Column(ARRAY(Text), nullable=True)
    pace = Column(Enum(PacePreference), nullable=True)

    user = relationship("User", back_populates="preferences")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    destination = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    purpose = Column(Text, nullable=True)
    traveler_count = Column(Integer, nullable=False, default=1)
    constraints = Column(JSON, nullable=True)       # dietary, mobility, wake/sleep, etc.
    share_token = Column(String(12), unique=True, nullable=True)
    trip_number = Column(Integer, nullable=False, default=1)  # 1=free, 2+ triggers paywall
    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.generating)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="trips")
    itinerary_dates = relationship("ItineraryDate", back_populates="trip", cascade="all, delete-orphan")


class ItineraryDate(Base):
    __tablename__ = "itinerary_dates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)

    trip = relationship("Trip", back_populates="itinerary_dates")
    activities = relationship("Activity", back_populates="itinerary_date", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    itinerary_date_id = Column(UUID(as_uuid=True), ForeignKey("itinerary_dates.id"), nullable=False)
    place_name = Column(String(255), nullable=False)
    place_id = Column(String(100), nullable=True)      # Google Places ID
    category_tag = Column(Enum(CategoryTag), nullable=True)
    time_window = Column(String(20), nullable=True)    # e.g. "09:00–11:00"
    estimate_cost = Column(Enum(CostBand), nullable=True)
    description = Column(Text, nullable=True)          # LLM-generated
    weather_note = Column(Text, nullable=True)          # only set if weather flagged
    latitude = Column(String(20), nullable=True)        # stored as strings to avoid PostGIS dependency
    longitude = Column(String(20), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    itinerary_date = relationship("ItineraryDate", back_populates="activities")
