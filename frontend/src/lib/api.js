/**
 * Authenticated JSON calls to the FastAPI backend (`/api/...`).
 * Base URL: `NEXT_PUBLIC_API_URL`, else `http://localhost:8000`.
 * Errors: throws `Error` with message `"{status}: {detail}"`; `err.status` is set when available.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authJsonHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseErrorBody(res) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    if (j && typeof j.detail !== "undefined") {
      return Array.isArray(j.detail)
        ? j.detail.map((e) => e.msg || JSON.stringify(e)).join("; ")
        : String(j.detail);
    }
  } catch {
    /* use raw text */
  }
  return text || `Request failed (${res.status})`;
}

async function jsonOrThrow(res) {
  if (res.ok) return res.json();
  const msg = await parseErrorBody(res);
  const err = new Error(`${res.status}: ${msg}`);
  err.status = res.status;
  throw err;
}

/** GET /api/users/me — quota / subscription for the signed-in Clerk user. */
export async function fetchUserStatus(token) {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return jsonOrThrow(res);
}

/** GET /api/trips — list trips for the current user (newest first). */
export async function fetchTrips(token) {
  const res = await fetch(`${API_BASE}/api/trips`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return jsonOrThrow(res);
}

/** GET /api/trips/:tripId — full trip payload (same shape as generate). */
export async function fetchTripDetails(tripId, token) {
  const res = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return jsonOrThrow(res);
}

/**
 * POST /api/generate — run itinerary generation and persist the trip.
 * `tripData` matches onboarding sessionStorage: uses `duration` (string days) or `duration_days`.
 */
export async function generateItinerary(tripData, token) {
  const raw = tripData.duration_days ?? tripData.duration;
  const duration = Number(raw);
  const duration_days =
    Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 1;
  const body = {
    destination: tripData.destination,
    origin: tripData.origin,
    month: tripData.month,
    duration_days,
    purpose: tripData.purpose,
    budget: tripData.budget,
    interests: Array.isArray(tripData.interests) ? tripData.interests : [],
  };
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res);
}

export async function sendTripChat(tripId, message, token) {
  const res = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/chat`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ message }),
  });
  return jsonOrThrow(res);
}

/**
 * GET /api/places/:placeId/photo — proxied image bytes; returns a blob URL for `<img src={...} />`.
 * Caller may `URL.revokeObjectURL` when discarding (optional; leaks if many unique URLs are created).
 */
export async function fetchPlacePhoto(placeId, token) {
  const res = await fetch(`${API_BASE}/api/places/${encodeURIComponent(placeId)}/photo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`${res.status}: ${msg}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
