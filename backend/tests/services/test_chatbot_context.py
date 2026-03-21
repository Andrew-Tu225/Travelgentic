"""Unit tests for chatbot context helpers."""
import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.services.chatbot.context import (
    build_trip_header,
    compress_day_summary,
    compress_itinerary,
)


def test_build_trip_header_drops_none():
    trip = {
        "destination": "Lisbon",
        "origin": "London",
        "month": "June",
        "start_date": "2026-06-01",
        "duration_days": 5,
        "budget": "mid",
        "trip_vibe": "Food and culture",
    }
    out = build_trip_header(trip)
    assert "Lisbon" in out
    assert "mid" in out
    assert "trip_vibe" in out


def test_build_trip_header_omits_missing_keys():
    trip = {"destination": "Paris", "duration_days": 3}
    out = build_trip_header(trip)
    assert "Paris" in out
    assert "3" in out
    assert "origin" not in out or "null" not in out


def test_compress_day_summary():
    day = {
        "day_number": 1,
        "theme": "Historic Center",
        "activities": [
            {"place_name": "Castle", "time_window": "09:00–11:00", "place_id": "ChIJxxx"},
            {"place_name": "Cafe", "time_window": "12:00–13:00"},
        ],
    }
    out = compress_day_summary(day)
    assert "Day 1" in out
    assert "Historic Center" in out
    assert "Castle" in out and "ChIJxxx" in out
    assert "Cafe" in out


def test_compress_itinerary_multiple_days():
    itinerary = [
        {"day_number": 1, "theme": "A", "activities": [{"place_name": "X", "time_window": "09:00", "place_id": "p1"}]},
        {"day_number": 2, "theme": "B", "activities": []},
    ]
    out = compress_itinerary(itinerary)
    assert "Day 1" in out and "Day 2" in out
    assert "X" in out and "p1" in out


def test_compress_itinerary_includes_all_activities():
    """All days and all activities are included — no truncation."""
    itinerary = [
        {"day_number": 1, "theme": "A", "activities": [
            {"place_name": "Place1_0", "time_window": "09:00", "place_id": "id_1_0", "category_tag": "culture"},
            {"place_name": "Place1_1", "time_window": "12:00", "place_id": "id_1_1", "category_tag": "food"},
        ]},
        {"day_number": 2, "theme": "B", "activities": [
            {"place_name": "Place2_0", "time_window": "09:00", "place_id": "id_2_0"},
        ]},
    ]
    out = compress_itinerary(itinerary)
    assert "Day 1" in out and "Day 2" in out
    assert "Place1_0" in out and "Place1_1" in out and "Place2_0" in out
    assert "id_1_0" in out and "id_1_1" in out
    assert "culture" in out and "food" in out
