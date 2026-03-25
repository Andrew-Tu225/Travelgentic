"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

/** Built-in rows for every trip (stable ids so localStorage checkbox state stays consistent). */
function getDefaultChecklistItems() {
  return [
    { id: "passport", label: "Valid passport & visa", isCustom: false },
    { id: "insurance", label: "Travel insurance confirmed", isCustom: false },
    { id: "data", label: "Local SIM or roaming data", isCustom: false },
    { id: "currency", label: "Currency & cards ready", isCustom: false },
  ];
}

/** Builds the localStorage key: per trip, and per Clerk user when signed in. */
function getStorageKey(tripId, userId) {
  if (userId) return `travelgentic_checklist_${userId}_${tripId}`;
  return `travelgentic_checklist_${tripId}`;
}

const LEGACY_KEY_PREFIX = "travelgentic_checklist_";

/** Turns a JSON string from localStorage into `{ done, customItems }`; supports older flat `{ id: boolean }` saves. */
function parseStored(raw) {
  if (!raw) return { done: {}, customItems: [] };
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return { done: {}, customItems: [] };
    if (Array.isArray(p.customItems) && p.done && typeof p.done === "object") {
      return {
        done: { ...p.done },
        customItems: p.customItems.filter(
          (x) => x && typeof x.id === "string" && typeof x.label === "string"
        ),
      };
    }
    const done = {};
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "boolean") done[k] = v;
    }
    return { done, customItems: [] };
  } catch {
    return { done: {}, customItems: [] };
  }
}

/** Reads and parses checklist data for a key (SSR-safe: returns empty on server). */
function loadState(storageKey) {
  if (typeof window === "undefined") return { done: {}, customItems: [] };
  try {
    const raw = localStorage.getItem(storageKey);
    return parseStored(raw);
  } catch {
    return { done: {}, customItems: [] };
  }
}

/** Writes `{ done, customItems }` JSON to localStorage; ignores failures (quota / private mode). */
function saveState(storageKey, done, customItems) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ done, customItems })
    );
  } catch {
    /* quota / private mode */
  }
}

/** After sign-in, copies `travelgentic_checklist_<tripId>` → user-scoped key once if the new key is empty. */
function migrateLegacyTripKey(tripId, userId, targetKey) {
  if (typeof window === "undefined" || !userId) return;
  try {
    if (localStorage.getItem(targetKey)) return;
    const legacyKey = `${LEGACY_KEY_PREFIX}${tripId}`;
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return;
    const parsed = parseStored(raw);
    saveState(targetKey, parsed.done, parsed.customItems);
  } catch {
    /* ignore */
  }
}

/** Generates a unique id for user-added rows (`custom_…`). */
function newCustomId() {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Trip sidebar checklist: default rows, user-added tasks, localStorage by trip + user. */
export function TripChecklist({ tripId, userId }) {
  const defaultItems = useMemo(() => getDefaultChecklistItems(), []);
  const [done, setDone] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [draft, setDraft] = useState("");

  const storageKey = useMemo(() => getStorageKey(tripId, userId), [tripId, userId]);

  const allItems = useMemo(() => {
    const customs = customItems.map((c) => ({
      id: c.id,
      label: c.label,
      isCustom: true,
    }));
    return [...defaultItems, ...customs];
  }, [defaultItems, customItems]);

  useEffect(() => {
    migrateLegacyTripKey(tripId, userId, storageKey);
    const loaded = loadState(storageKey);
    const defs = getDefaultChecklistItems();
    const defaultIds = new Set(defs.map((i) => i.id));
    const validCustom = loaded.customItems.filter(
      (x) => x && typeof x.id === "string" && typeof x.label === "string" && x.id.startsWith("custom_")
    );
    setCustomItems(validCustom);
    const allIds = new Set([...defaultIds, ...validCustom.map((c) => c.id)]);
    const mergedDone = {};
    allIds.forEach((id) => {
      mergedDone[id] = typeof loaded.done[id] === "boolean" ? loaded.done[id] : false;
    });
    setDone(mergedDone);
  }, [storageKey, tripId, userId]);

  /** Persists checkbox map + custom rows to localStorage. */
  const persist = useCallback(
    (nextDone, nextCustom) => {
      saveState(storageKey, nextDone, nextCustom);
    },
    [storageKey]
  );

  /** Flips checked state for one row and saves. */
  const toggle = useCallback(
    (id) => {
      setDone((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        persist(next, customItems);
        return next;
      });
    },
    [customItems, persist]
  );

  const addCustom = useCallback(() => {
    const label = draft.trim().replace(/\s+/g, " ");
    if (!label || label.length > 200) return;
    const dup = allItems.some(
      (i) => i.label.toLowerCase() === label.toLowerCase()
    );
    if (dup) return;
    const id = newCustomId();
    const nextCustom = [...customItems, { id, label }];
    const nextDone = { ...done, [id]: false };
    setCustomItems(nextCustom);
    setDone(nextDone);
    persist(nextDone, nextCustom);
    setDraft("");
  }, [draft, allItems, customItems, done, persist]);

  /** Deletes a user-added row and its done flag. */
  const removeCustom = useCallback(
    (id) => {
      const nextCustom = customItems.filter((x) => x.id !== id);
      const nextDone = { ...done };
      delete nextDone[id];
      setCustomItems(nextCustom);
      setDone(nextDone);
      persist(nextDone, nextCustom);
    },
    [customItems, done, persist]
  );

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <h3 className="mb-1 font-sans text-base font-bold text-[#003580]">
        Smart checklist
      </h3>
      <p className="mb-4 font-sans text-[11px] leading-snug text-[#94a3b8]">
        Saved on this device
        {userId ? " for your account" : ""}. Add your own tasks below.
      </p>
      <ul className="flex flex-col gap-3">
        {allItems.map((item) => {
          const checked = !!done[item.id];
          return (
            <li key={item.id}>
              <div className="flex w-full items-start gap-2">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      checked
                        ? "border-[#003580] bg-[#003580] text-white"
                        : "border-[#cbd5e1] bg-white"
                    }`}
                  >
                    {checked ? (
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </span>
                  <span
                    className={`min-w-0 font-sans text-sm leading-snug ${
                      checked ? "text-[#64748b] line-through" : "text-[#001A41]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
                {item.isCustom ? (
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => removeCustom(item.id)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 font-sans text-[11px] text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#64748b]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-2 border-t border-[#f1f5f9] pt-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add a task…"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 font-sans text-sm text-[#001A41] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#FF7D54] focus:bg-white"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl bg-[#003580] px-4 py-2 font-sans text-sm font-semibold text-white transition-colors hover:bg-[#004799] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
