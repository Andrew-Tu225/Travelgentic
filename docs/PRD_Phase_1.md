# Travelgentic - Phase 1 Product Requirements Document (PRD)

## 1. Strategy & Goals

### Phase 1 Strategy
Phase 1 is a single-purpose build: **prove that Travelgentic's AI can generate itineraries good enough that people want to share them.** Nothing else gets built until this core hypothesis is confirmed.

### The One Metric That Matters
**High Intent Shareability:** A user opens the shareable link and does not immediately close it. 
* *Secondary signal:* They forward or copy the link to others. 
If this is not happening, the generation quality is not yet there — no amount of editing UI or export polish will fix a fundamentally weak itinerary.

## 2. Scope & Constraints
**Timeframe:** Everything below must be shippable in **4–6 weeks**.
**Scope Management:** If scope pressure arises, cut from the editing UI first, then export. **Never cut the onboarding flow or generation engine** — those are the product.

---

## 3. Features

# Feature 1 — Onboarding Flow

*Lean 2-step form that collects the minimum structured input needed to generate a high-quality itinerary. Deliberately trimmed from the original 5-step plan — the fewer fields before generation, the more the product lives up to its "easier planning" promise.*

## Steps

**Step 1 — Trip Basics:** Destination (or "Help me choose"), origin city, month + duration.
- *Note:* "Help me choose destination" appears prominently here, not as a secondary option. Suggests 1–3 destinations with short rationale.

**Step 2 — Vibe & Interests:** Free-text purpose/vibe, budget tier (4 options), top 3 interests (chip select, max 3).

## Key Implementation Notes

- On clicking "Generate Itinerary", fire the LLM call immediately against an anonymous session UUID. Store the result server-side with a 24-hour TTL.
- Auth gate appears *after* generation, not before. The prompt reads "Your itinerary is ready — create a free account to view it." Google OAuth is the primary CTA; email/password as fallback. Returning users see a prominent "Log in instead" toggle on the same screen.
- Trip count is enforced server-side on the user record (`trips_generated`). Logged-in users with `trips_generated >= 2` are redirected to the paywall *before* the onboarding form — do not let them fill the form and generate before hitting the wall.
- Anonymous users who never complete signup: TTL expires after 24 hours, trip is cleaned up.
- Smart defaults throughout — pre-fill sensible values so users can move fast.

### Feature 2 — Itinerary Generation Engine
*The core of the product. Uses external APIs for place data and an LLM to synthesize, filter, and schedule based on user inputs.*

**Data Sources:**
* **Google Places API:** Attraction data (ratings, photos, hours, categories, coordinates).
* **Foursquare:** Secondary/fallback data, especially strong for food and local spots.

**Generation Logic:**
* **LLM Call 1:** Map free-text trip purpose + travelers' constraints + user's interests → activity patterns and pacing rules (e.g., "recharge" = max 2 anchor activities/day, long lunches, no early starts).
* **LLM Call 2:** Given activity patterns + Places API results, produce a day-by-day JSON schedule.
* **Heuristics Layer:** Geographic clustering per day, realistic travel time between items, daily activity count within pace preference, cost estimation per activity.

**Output Format (Day JSON Outline):**
| Field | Description |
| :--- | :--- |
| `place_name` | Display name from Google Places |
| `description` | 1–2 sentence LLM-generated summary tailored to trip purpose |
| `category_tag` | food / nature / culture / nightlife / adventure / wellness |
| `time_window` | e.g., "10:00–12:00" — respects wake/sleep prefs and pace |
| `estimated_cost_usd` | Per-person activity cost band: free / $1–20 / $20–60 / $60+ |
| `place_id` | Google Places ID for linking and future booking integration |

**Cost Estimation Scope:**
* Activity-level only. Explicitly excluded: flights, accommodation, airport transfers.
* *Visible Disclaimer Needed:* "Estimated activity costs only — does not include flights, hotels, or transport to your destination." (Prevents false expectations).

### Feature 3 — Itinerary View (Read-Only + One Edit Action)
*Vertical day-by-day card layout. Lean and fast to build. Editing complexity is deliberately minimal to validate generation first.*

**Card Layout (Per Activity):**
* Place name, category tag, time window, estimated cost band.
* 1–2 sentence description.
* Weather note badge if applicable.

**Phase 1 Interactions:**
* **Regenerate this day:** Re-runs generation for one day, keeping all others unchanged. No limit.
* **Regenerate full itinerary:** Re-runs everything from scratch. Unlimited for trip #1.

### Feature 4 — Shareable Read-Only Link
*The only export/share mechanism in Phase 1 to test the core hypothesis.*

* **Functionality:** Generate a unique URL (e.g., `travelgentic.com/trip/abc123`). No auth required to view.
* **View:** Read-only version of the itinerary with no edit controls.
* **UI:** "Copy link" button prominently placed on the itinerary page.
* **SEO/Social:** Basic metadata in the page title for link previews (e.g., "7 Days in Lisbon — Travelgentic").

### Feature 5 — Weather Awareness (Free Tier)
*Lightweight to implement, high delight factor, positioning the tool as a "realistic planner".*

* **Functionality:** Call OpenWeatherMap forecast API for the destination + dates during generation.
* **Logic:** If rain or extreme heat/cold is predicted, flag affected outdoor activities and have the LLM suggest an indoor alternative in the `weather_note` field.
* **UI:** Visual badge on affected activity cards (e.g., "Rain expected — indoor alt suggested").

---

## 4. Out of Scope

| Deferred to Phase 2 | Not in Roadmap (Post-MVP) |
| :--- | :--- |
| Granular editing UI (swap, pin, replace) | Flight/hotel booking |
| PDF export | Real-time mobile assistant |
| Email summary | Multi-user collaboration |
| Trip management (save multiple trips) | Human concierge |
| Free/Plus tier split + paywalling | Email confirmation parsing |
| Global tone toggles | Affiliate booking links |

---

## 5. Monetization (Phase 1 Approach)

**No hard paywall in Phase 1.** The goal is user trust and validation — not revenue. The structure below seeds the conversion funnel while feeling generous.

**The Plans:**
* **Free Tier:** First trip fully unlimited (no regeneration caps), full onboarding, weather-aware suggestions, shareable links, etc.
* **Travelgentic Plus (Phase 2):** 
  * Unlimited saved trips, PDF/Email summaries, granular editing UI.
  * Price: $9.99–14.99/month or $99/year.
* **Single-Trip Boost:**
  * Price: $2.99–4.99 per trip.
  * *Context:* The primary conversion lever since leisurely travelers plan 1-3 trips per year. A much lower psychological barrier than a subscription.

**Paywall Trigger:**
The paywall activates **only from the second trip onward**. 
*Why?* Users who have already experienced a great itinerary on trip #1 are highly motivated to pay for trip #2. Asking for money at the moment of highest intent is better than at the moment of first impression.
