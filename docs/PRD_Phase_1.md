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

### Feature 1 — Onboarding Flow
*Smart form/chat hybrid that collects structured input needed to generate a high-quality itinerary.*

**Steps:**
1. **Trip Basics:** Origin city, destination (or "Help me choose"), dates or month + duration.
   * *Note:* "Help me choose destination" must appear prominently here, not as a secondary option. Suggest 1–3 destinations with short rationale based on purpose + interests before generating.
2. **Purpose & Travelers:** Free-text purpose, traveler count + ages, budget tier.
3. **Interests & Vibe:** Top 3 interests checklist, pace preference (slow / moderate / fast-paced).
4. **Constraints (Progressive Disclosure):** Mobility, dietary, must-sees, wake/sleep times, fixed commitments, accessibility. 
   * *Note:* Default to hidden. Show only if the user expands them.
5. **Review & Generate:** Summary card, one-click generate button.

**Key Implementation Notes:**
* Utilize progressive disclosure for advanced constraints.
* Employ smart defaults throughout — pre-fill sensible values so users can move fast.

### Feature 2 — Itinerary Generation Engine
*The core of the product. Uses external APIs for place data and an LLM to synthesize, filter, and schedule based on user inputs.*

**Data Sources:**
* **Google Places API:** Attraction data (ratings, photos, hours, categories, coordinates).
* **Foursquare:** Secondary/fallback data, especially strong for food and local spots.
* **OpenWeatherMap API:** Weather forecasts — used to swap outdoor activities if rain is predicted.

**Generation Logic:**
* **LLM Call 1:** Map free-text purpose → activity patterns and pacing rules (e.g., "recharge" = max 2 anchor activities/day, long lunches, no early starts).
* **LLM Call 2:** Given activity patterns + Places API results + constraints, produce a day-by-day JSON schedule.
* **Heuristics Layer:** Geographic clustering per day, realistic travel time between items, daily activity count within pace preference, cost estimation per activity.

**Output Format (Day JSON Outline):**
| Field | Description |
| :--- | :--- |
| `place_name` | Display name from Google Places |
| `description` | 1–2 sentence LLM-generated summary tailored to trip purpose |
| `category_tag` | food / nature / culture / nightlife / adventure / wellness |
| `time_window` | e.g., "10:00–12:00" — respects wake/sleep prefs and pace |
| `estimated_cost_usd` | Per-person activity cost band: free / $1–20 / $20–60 / $60+ |
| `weather_note` | Optional: "Rain expected — indoor alternative suggested" |
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
