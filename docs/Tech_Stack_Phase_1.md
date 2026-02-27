# Travelgentic - Phase 1 Technical Architecture & Stack

## Overview
This document outlines the technical architecture and chosen stack for Phase 1 of Travelgentic. The stack is optimized for speed of development, responsiveness, and leveraging external APIs for core functionality without requiring a complex internal database for place data.

## Recommended Stack

| Layer | Recommended Stack | Notes |
| :--- | :--- | :--- |
| **Frontend** | Next.js + Tailwind CSS | Responsive by default; easy Server-Side Rendering (SSR) for shareable link previews. |
| **Backend API** | FastAPI | Thin API layer to orchestrate LLM and Places API calls. |
| **LLM** | Gemini API | Use structured output / function calling to reliably generate the JSON itinerary. |
| **Place Data** | Google Places API | Provides ratings, photos, hours, coordinates. Reduces the need for an internal database for point-of-interest data. |
| **Weather** | OpenWeatherMap API | Free tier is sufficient for MVP volumes; provides the necessary forecast endpoint. |
| **Storage** | PostgreSQL + S3 | PostgreSQL for user data and saved trips; Amazon S3 for caching photos. |
| **Authentication**| Clerk | Optional in Phase 1 — only strictly needed if saving trips across multiple sessions. |
| **Hosting** | Vercel + Railway | Fast to deploy and scales automatically. Vercel for the frontend, Railway for the backend/database. |
