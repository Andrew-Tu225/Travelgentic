# Trip Page + Chatbot UI Plan

## 1. Current trip/[id] design summary

- **Background**: `#100e0b`, radial glow `rgba(200,169,110,0.15)` at top.
- **Typography**: Serif (Fraunces) for headings, DM Sans for body; accent `#C8A96E` (gold).
- **Layout**: AppHeader (sticky, blurred), trip header (destination, vibe, badges), day pills (mobile) / horizontal day columns (desktop), activity cards with category colors.
- **Modals**: Activity image modal uses `bg-[#151310]`, border `white/10`, backdrop blur.
- **Tokens**: `--primary: #C8A96E`, `--primary-hover: #d4b97a`, borders `white/[0.05–0.12]`, cards `bg-white/[0.02]` + `backdrop-blur-[8px]`.

---

## 2. Chatbot API contract (already implemented)

- **Endpoint**: `POST /api/trips/{trip_id}/chat`
- **Body**: `{ "message": string }` (min length 1)
- **Response**: `{ "message": string, "itinerary": [...] }` — agent reply + updated itinerary (persisted). Frontend can refresh trip data or merge `itinerary` into local state.

---

## 3. Chatbot placement and “transparent but obvious”

**Goal**: Chatbot is visible and discoverable without dominating the page.

**Recommendation: floating, glass-style panel (transparent but obvious)**

- **Position**: Fixed bottom-right (e.g. 24px from bottom, 24px from right on desktop; 16px on mobile). Stays above page content and doesn’t reflow the itinerary.
- **Transparency**: Use the same language as the rest of the app:
  - Panel: `bg-[#151310]/95` or `bg-white/[0.06]` with `backdrop-blur-[12px]`, border `border-white/[0.08]`.
  - Makes it feel “light” and integrated but still clearly a distinct UI block.
- **Obviousness**:
  - **FAB (closed state)**: Single floating button with icon (e.g. chat bubble or “✦”) and optional short label “Ask” or “Trip assistant”. Use primary gold `#C8A96E` for icon/ring so it stands out on dark background.
  - **Open state**: Expand to a panel (e.g. 380px width, max-height ~70vh) with header “Trip assistant”, message list, and input. A subtle glow or border in primary keeps it noticeable.
- **Why not fully transparent for the convo**: Full transparency would hurt readability of messages. Recommendation: **semi-transparent background + blur** so the panel is “transparent” in spirit (see-through, light) but text remains readable and the panel is obviously there.

**Alternatives considered**

- **Inline above/below itinerary**: Uses a lot of vertical space and competes with day columns; not ideal for a secondary action.
- **Sidebar**: Good for desktop but awkward on mobile; can be a later variant.
- **Full-screen overlay**: Too heavy for “quick questions” on a trip page.

---

## 4. Component structure

```
trip/[id]/page.js          ← existing; add <TripChatbot tripId={params.id} trip={trip} onItineraryUpdate={setTrip} />
components/
  chatbot/
    TripChatbot.js         ← client component: FAB + expandable panel, state, API call
    ChatbotPanel.js        ← open panel: header, messages, input, loading
    ChatMessage.js         ← single message (user / assistant), optional markdown
    ChatbotFab.js          ← closed-state button (icon + optional “Ask”)
```

- **TripChatbot**: Holds open/closed state, message list, and `sendMessage(tripId, message, token)`. On success, calls `onItineraryUpdate(agentResult.itinerary)` so the parent can set `trip.itinerary` and re-render. Optional: optimistic UI then reconcile with server.
- **ChatbotPanel**: Renders messages, scrollable area, textarea + send button; disables send while loading.
- **ChatMessage**: Renders one message; assistant messages can support simple markdown or line breaks.
- **ChatbotFab**: The floating button; aria-label and keyboard (e.g. focus when panel opens) for accessibility.

---

## 5. UI design details (modern, consistent with trip page)

### 5.1 FAB (closed)

- Size: 56px circle (or 48px on mobile).
- Style: `bg-[#151310]/90` or `bg-white/[0.06]`, `backdrop-blur-[12px]`, `border border-white/[0.08]`, ring or icon in `#C8A96E`.
- Hover: Slight scale (e.g. 1.05), border `white/[0.12]`, optional soft glow.
- Optional: Small “Ask” or “Trip assistant” label that appears on hover (desktop).
- z-index: Above content, below modals (e.g. z-40; activity modal can stay z-50).

### 5.2 Panel (open)

- **Container**: Rounded (e.g. 16px or 20px), shadow, `max-h-[70vh]`, flex column.
- **Header**: “Trip assistant” (or “Ask about this trip”), close button; same font (serif for title if desired) and `text-white/80`.
- **Messages**: Scrollable area; user messages right-aligned or distinct (e.g. `bg-white/[0.08]`), assistant left-aligned (`bg-white/[0.04]` or transparent with border). Same 12–14px body text, good line-height.
- **Input**: Single line or 2-line textarea, `bg-white/[0.06]`, `border-white/[0.1]`, focus ring primary; send button with primary gradient when enabled, disabled state when loading or empty.
- **Loading**: Inline “Assistant is thinking…” with subtle spinner (reuse trip page spinner style).

### 5.3 After agent reply (itinerary changed)

- Call `onItineraryUpdate(updatedItinerary)` so `trip` state in `page.js` updates.
- Optional: Short toast or inline note “Itinerary updated” so the user sees that the list below changed.
- No full-page reload; keep panel open with the new message.

### 5.4 Responsive

- **Desktop**: Panel 380px width, bottom-right.
- **Mobile**: Panel full-width with horizontal margin (e.g. 16px), or near full-width; FAB same corner (e.g. 16px inset). Consider sliding up from bottom (sheet-style) for thumb reach.

---

## 6. Page-level tweaks (modern UI, room for chatbot)

- **Bottom padding**: Page already has `pb-32`; ensures content isn’t hidden behind the FAB. Keep or increase slightly so the last day cards are fully visible.
- **No layout change needed** for the main content; chatbot is an overlay layer.
- Optional **micro-copy**: In the trip header actions area, a small hint like “Need changes? Ask the trip assistant” with a link that opens the chatbot (scroll to FAB or set open state via ref/callback). Keeps the UI modern and discoverable.

---

## 7. Implementation order

1. **API in frontend**: Add `sendTripChat(tripId, message, token)` in `lib/api.js` calling `POST /api/trips/{trip_id}/chat`, return `{ message, itinerary }`.
2. **ChatbotFab**: Implement FAB with icon, positioning, hover; wire to open panel.
3. **ChatMessage + ChatbotPanel**: Implement panel layout, message list, input, send; integrate `sendTripChat` and loading state.
4. **TripChatbot**: Compose FAB + panel, manage messages state and `onItineraryUpdate`; pass `tripId`, `trip` (for context if needed), and `onItineraryUpdate`.
5. **trip/[id]/page.js**: Render `<TripChatbot tripId={params.id} trip={trip} onItineraryUpdate={...} />` and update trip state from `agentResult.itinerary` (e.g. `setTrip(prev => ({ ...prev, itinerary: updatedItinerary }))`).
6. **Polish**: Keyboard (Escape to close), aria-labels, optional “Itinerary updated” feedback, optional header hint to open chatbot.

---

## 8. Transparency summary

- **Yes**: Chatbot can be **transparent in feel** — glass panel (`backdrop-blur` + semi-transparent background) so it doesn’t feel like a solid box and fits the trip page aesthetic.
- **Still obvious**: FAB with primary accent and clear “Trip assistant” panel title + distinct message bubbles make it unmistakable. So: transparent style, but clearly visible and readable.

---

## 9. File checklist

| Item | Path |
|------|------|
| API helper | `frontend/src/lib/api.js` — add `sendTripChat` |
| Container | `frontend/src/components/chatbot/TripChatbot.js` |
| Panel | `frontend/src/components/chatbot/ChatbotPanel.js` |
| Message | `frontend/src/components/chatbot/ChatMessage.js` |
| FAB | `frontend/src/components/chatbot/ChatbotFab.js` |
| Integration | `frontend/src/app/trip/[id]/page.js` — mount TripChatbot, wire `onItineraryUpdate` |

This plan keeps the existing trip/[id] design intact, adds a modern floating chatbot that feels transparent but obvious, and uses the existing backend contract without changes.
