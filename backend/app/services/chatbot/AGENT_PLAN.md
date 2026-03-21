# Chatbot Agent Plan — Itinerary Q&A and Updates

## 1. Overview

The chatbot is a **travel planning assistant** that:
- Answers user questions about their trip itinerary.
- Makes updates to the itinerary based on user prompts (add/remove/modify activities).
- Uses an **agent loop** with a fixed set of tools and a **max of 5 iterations** (tool calls + model turns).
- Returns a **short chatbot message** and the **updated itinerary** (full structure, not compressed).

---

## 2. Agent Context

### 2.1 Trip header (basic trip info + onboarding-style data)

Provide the agent with a **trip header** in JSON form so it knows destination, dates, budget, vibe, etc. This comes from the trip record (and any stored onboarding answers).

- **Source**: Trip entity + optional stored onboarding payload.
- **Format**: Single JSON object, one line or pretty-printed, kept short (~100–150 tokens).
- **Implementation**: Use `build_trip_header(trip)` from `app.services.chatbot.context`.

**Example fields**: `destination`, `origin`, `month`, `start_date`, `duration_days`, `budget`, `trip_vibe`. If you later store `purpose` or `interests` on the trip, include them too.

### 2.2 Compressed itinerary (~200–300 tokens)

The agent receives the **current itinerary in compressed form** to save tokens and focus on structure.

- **Implementation**: Use `compress_itinerary(itinerary)` from `app.services.chatbot.context`.
- **Input**: Full itinerary list (each day has `day_number`, `theme`, `activities`; each activity has `place_name`, `place_id`, `time_window`, etc.).
- **Output**: A single string, ~200–300 tokens, e.g.:
  - `Day 1 (Theme): 09:00–11:00 Place A; 12:00–14:00 Place B | Day 2 ...`
- **Rules**: Include day number, theme, and per activity: time_window and place_name (and place_id for modify/remove). Omit long descriptions in the compressed view.

---

## 3. Tools

The agent has access to these tools only.

### 3.1 `search_places`

- **Source**: `app.services.places_service.search_places`
- **Parameters**: `query` (required), `location` (optional, `"lat,lng"`), `radius` (optional, meters).
- **Use**: Find places to add (e.g. “coffee shop Lisbon”, “museums in Paris”). Agent should put location in `query` when needed (e.g. “cafes in Lisbon”).

### 3.2 `get_place_details`

- **Source**: `app.services.places_service.get_place_details`
- **Parameters**: `place_id` (required).
- **Use**: Get details for a place before adding or when user asks about a specific spot. Optional if search result already has enough info.

### 3.3 `update_itinerary`

- **Description**: Make changes to the itinerary. Can add a new activity, remove an existing one, or modify fields on an existing one (e.g. `time_window`, `description`). Always confirm what you changed in your response.
- **Parameters**:
  - `operation`: `'add' | 'remove' | 'modify'`
  - `day`: number — which day to change
  - `place_id`: string — required for add (from `search_places` result) and for remove/modify (from existing itinerary)
  - `fields`: object — for **modify** only: only the fields being changed, e.g. `{ "time_window": "09:00–11:00" }`
- **Semantics**:
  - **add**: Append one activity to the given day; activity data (name, description, time_window, etc.) must come from search/details or be inferred; backend resolves place_id → full activity record.
  - **remove**: Remove the activity with that `place_id` on that day.
  - **modify**: Update the given fields on the activity with that `place_id` on that day.
- **Implementation**: Backend applies the operation to the in-memory (or DB) itinerary and returns the updated itinerary (or delta) so the agent sees the new state (e.g. via updated compressed itinerary on next turn).

---

## 4. System prompt (agent instructions)

Use this as the system (or equivalent) prompt for the agent:

```text
You are a travel planning assistant helping a user refine their itinerary.

Trip context:
{trip_header}

Current itinerary:
{compressed_itinerary}

You have access to tools to search for places and modify the itinerary.
When making changes, always explain what you did and why it fits the trip.
Never modify days the user didn't ask about.
If a search returns no good results, say so rather than adding a poor fit.
```

- `trip_header`: output of `build_trip_header(trip)`.
- `compressed_itinerary`: output of `compress_itinerary(itinerary)`.

---

## 5. Agent loop (max 5 iterations)

- **One iteration** = one model turn that may include one or more tool calls; after tools run, one more model turn to produce the final reply (or another tool call).
- **Cap**: Stop after **5 iterations** (configurable constant, e.g. `MAX_AGENT_ITERATIONS = 5`). If the model keeps requesting tools after 5 iterations, stop anyway and return the last assistant message and current itinerary.
- **Flow**:
  1. Initialize with: system prompt (trip_header + compressed_itinerary) + user message.
  2. Loop:
     - Call LLM with current messages + tool definitions.
     - If no tool calls (or empty): break and use that reply as the final message.
     - Else: for each tool call, run the corresponding function (`search_places`, `get_place_details`, or `update_itinerary`). Append tool results to the conversation. If `update_itinerary` was called, refresh the itinerary state and (for next turn) regenerate `compressed_itinerary` and inject it (e.g. as a system or user “current itinerary” update).
     - Increment iteration count; if ≥ 5, break and use last assistant content as the final message (or a short “I’ve made the main changes; here’s what’s updated” if the last turn was only tool calls).
  3. Return:
     - **Short chatbot message**: 1–3 sentences summarizing what was done or answered; no long paragraphs.
     - **Updated itinerary**: full itinerary structure (same shape as `GET /trips/{trip_id}`), either from the last `update_itinerary` result or the initial itinerary if no updates were made.

---

## 6. Tool-call execution and state

- **search_places** / **get_place_details**: Stateless; call and append result to conversation.
- **update_itinerary**: Stateful. The backend (or agent runner) keeps the current itinerary in memory for the session. When `update_itinerary` is invoked:
  - Apply add/remove/modify to that structure.
  - Return the updated full itinerary (and optionally a short “OK, updated” summary).
  - On the next model turn, pass the new `compress_itinerary(itinerary)` so the agent sees the latest state.

If the chatbot is request-scoped (no session), “current itinerary” is the one loaded at the start of the request and all updates are applied to a copy; the response returns that copy as “updated itinerary” and the API layer can persist it (e.g. PATCH trip or replace itinerary).

---

## 7. Output contract

The agent runner returns a single response object, e.g.:

```json
{
  "message": "I've added Café Lisboa to Day 2 and moved the museum visit to 14:00–16:00.",
  "itinerary": [ { "day_number": 1, "theme": "...", "activities": [ ... ] }, ... ]
}
```

- **message**: Short, user-facing summary (used as the chatbot reply).
- **itinerary**: Full itinerary (same structure as `GET /trips/{trip_id}` → `itinerary`). If no updates, return the same itinerary that was passed in.

---

## 8. Implementation checklist

- [ ] **Context module** (`app.services.chatbot.context`):
  - [ ] `build_trip_header(trip)` → JSON string (trip + onboarding-style fields).
  - [ ] `compress_itinerary(itinerary)` → single string ~200–300 tokens.
  - [ ] Optional: `compress_day_summary(day)` for single-day summary (already referenced by add_activity handler).
- [ ] **Tools layer**:
  - [ ] Wrap `search_places` and `get_place_details` for the LLM (names, parameter schemas).
  - [ ] Implement `update_itinerary(operation, day, place_id, fields, current_itinerary)` that returns updated itinerary (and optionally a short confirmation string).
- [ ] **Agent runner**:
  - [ ] Load trip + itinerary (from DB or passed in).
  - [ ] Build system prompt with `trip_header` and `compressed_itinerary`.
  - [ ] Loop with max 5 iterations; on each turn run tool calls, refresh itinerary and compressed view after `update_itinerary`.
  - [ ] Return `{ "message", "itinerary" }`.
- [ ] **API** (if needed):
  - [ ] Endpoint that receives trip_id + user message, runs the agent, persists updated itinerary (e.g. replace activities for affected days), returns `message` and optionally full trip.
- [ ] **LLM**: Use Gemini (or existing client) with tool-calling / function-calling; map tool names to the three functions above.

---

## 9. Edge cases

- **User asks only a question** (e.g. “What’s on Day 2?”): Agent should answer from context; no tool calls. Return same itinerary.
- **User asks to add something but search returns nothing**: Agent says so in the message; does not call `update_itinerary`. Return same itinerary.
- **User asks to modify a day they didn’t specify**: Agent should not change other days (per system prompt).
- **Max iterations reached**: Return last sensible reply and current itinerary; optionally append “I’ve applied the main changes; ask again if you want more edits.”
- **Malformed or invalid tool args**: Validate before calling; return error in tool result so the agent can reply appropriately.

This plan keeps the agent focused, token-efficient, and predictable (max 5 iterations, clear output contract).
