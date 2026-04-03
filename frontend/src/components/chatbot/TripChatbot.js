"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sendTripChat } from "@/lib/api";

function Spinner({ className }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#003580] ${className || ""}`}
    />
  );
}

/** Starter prompts: prefill = user completes the sentence; send = one-tap full intent. */
const TRIP_CHAT_STARTERS = [
  {
    id: "place",
    label: "Tell me more about…",
    mode: "prefill",
    text: "Tell me more about ",
  },
  {
    id: "add",
    label: "Add an activity",
    mode: "prefill",
    text: "Please add an activity on day 1: ",
  },
  {
    id: "swap",
    label: "Change or remove something",
    mode: "prefill",
    text: "Please update my itinerary: remove or replace ",
  },
  {
    id: "day",
    label: "Soften one busy day",
    mode: "send",
    text: "Please suggest a lighter schedule for my busiest day and adjust the itinerary if it makes sense.",
  },
];

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "whitespace-pre-wrap break-words rounded-[14px] px-3 py-2 text-[13px] leading-[1.5] border",
          isUser
            ? "ml-8 max-w-[85%] border-[#FF7D54]/40 bg-[#fff7ed] text-[#001A41]"
            : "mr-8 max-w-[85%] border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}

function StarterChips({ disabled, onPrefill, onSend }) {
  return (
    <div
      className="mt-3 border-t border-[#e2e8f0]/80 pt-3"
      role="region"
      aria-label="Suggested prompts"
    >
      <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
        Try asking
      </p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {TRIP_CHAT_STARTERS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => (s.mode === "send" ? onSend(s.text) : onPrefill(s.text))}
            className={[
              "rounded-full border px-2.5 py-1 text-left font-sans text-[11px] font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-[12px]",
              disabled
                ? "cursor-not-allowed border-[#e2e8f0] bg-[#f1f5f9] text-[#94a3b8]"
                : "border-[#e2e8f0] bg-white text-[#003580] hover:border-[#FF7D54]/50 hover:bg-[#fff7ed]",
            ].join(" ")}
            aria-label={
              s.mode === "send"
                ? `Send: ${s.label}`
                : `Insert starter text: ${s.label}`
            }
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TripChatbotPanel({
  tripDestination,
  messages,
  loading,
  error,
  input,
  canChat,
  trimmed,
  onInputChange,
  onSend,
  onSendWithText,
  onClose,
  textareaRef,
  endRef,
  showStarters,
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-xl max-h-[min(68dvh,520px)] sm:max-h-[min(86vh,680px)] sm:max-w-none">
      <div className="flex shrink-0 items-center justify-between gap-3 bg-[#003580] px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </span>
            <p className="truncate font-sans text-[13px] font-semibold text-white">
              Travel Assistant
            </p>
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wide text-white">
              Online now
            </span>
          </div>
          {tripDestination ? (
            <p className="mt-1 truncate font-sans text-[11px] text-white/70">{tripDestination}</p>
          ) : null}
        </div>

        {onClose ? (
          <button
            type="button"
            aria-label="Close Travel Assistant"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fafafa] px-3 py-3">
        {messages.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            {messages.map((m, idx) => (
              <MessageBubble key={`${m.role}-${idx}`} role={m.role} content={m.content} />
            ))}
          </div>
        )}

        {showStarters ? (
          <StarterChips
            disabled={loading || !canChat}
            onPrefill={(text) => {
              onInputChange(text);
              requestAnimationFrame(() => {
                const el = textareaRef?.current;
                if (!el) return;
                el.focus();
                const len = el.value.length;
                try {
                  el.setSelectionRange(len, len);
                } catch {
                  /* ignore */
                }
              });
            }}
            onSend={(text) => onSendWithText(text)}
          />
        ) : null}

        {loading ? (
          <div className="mt-2">
            <div className="flex justify-start">
              <div className="mr-8 max-w-[85%] rounded-[14px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] text-[#64748b]">
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span>Travel Assistant is thinking…</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 px-2 text-[12px] text-red-600">{error}</p> : null}

        <div ref={endRef} />
      </div>

      <div className="border-t border-[#e2e8f0] bg-white px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={loading || !canChat}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask to update this trip…"
            className="min-h-[46px] w-full resize-none rounded-xl border-2 border-[#e2e8f0] bg-white px-4 py-3 font-sans text-[14px] text-[#001A41] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#FF7D54]"
          />

          <button
            type="button"
            disabled={loading || !canChat || !trimmed}
            onClick={onSend}
            className={[
              "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border-none transition-all duration-200 sm:h-[46px] sm:w-[46px]",
              "bg-[#003580] text-white hover:bg-[#004799] hover:-translate-y-0.5",
              loading || !canChat || !trimmed
                ? "cursor-not-allowed opacity-45 hover:translate-y-0"
                : "",
            ].join(" ")}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <span className="text-[16px]">➤</span>
            )}
          </button>
        </div>

        <p className="mt-1.5 hidden px-1 text-[11px] leading-snug text-[#94a3b8] sm:mt-2 sm:block">
          Enter to send · Shift+Enter for a new line · I can explain places, or change your schedule.
        </p>
        <p className="mt-1.5 px-1 text-[10px] leading-snug text-[#94a3b8] sm:hidden">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export function TripChatbot({ tripId, tripDestination, onItineraryUpdate }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);
  const endRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);

  const canChat = useMemo(() => !!tripId, [tripId]);
  const trimmed = input.trim();
  const welcomeMessage = tripDestination
    ? `Hi! I can explain places on your trip, update your day-by-day schedule, and add or remove activities for ${tripDestination}. Use the shortcuts below or type your own question.`
    : "Hi! I can explain places on your trip, update your schedule, and add or remove activities. Use the shortcuts below or type your own question.";

  useEffect(() => {
    if (!open) return;
    if (!canChat) return;
    if (messages.length > 0) return;

    setMessages([
      {
        role: "assistant",
        content: welcomeMessage,
      },
    ]);
  }, [open, canChat, messages.length, welcomeMessage]);

  useEffect(() => {
    if (!open) return;
    if (!shouldAutoScrollRef.current) return;
    shouldAutoScrollRef.current = false;

    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showStarters = canChat && !hasUserMessage && !loading;

  async function handleSend(overrideText) {
    if (!canChat || loading) return;
    const messageText = (overrideText != null ? String(overrideText) : input).trim();
    if (!messageText) return;

    shouldAutoScrollRef.current = true;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setLoading(true);

    try {
      const result = await sendTripChat(tripId, messageText);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message || "Got it. I updated your itinerary.",
        },
      ]);

      onItineraryUpdate?.(result.itinerary);
    } catch (err) {
      console.error("Trip chatbot failed:", err);
      setError(err?.message || "Chatbot failed. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry — I couldn't update your trip. Please try asking again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          aria-label="Open Travel Assistant"
          onClick={() => {
            setOpen(true);
          }}
          disabled={!canChat}
          className={[
            "fixed z-[45] flex items-center justify-center rounded-full shadow-lg transition-all duration-200",
            "h-[56px] w-[56px] right-4 bottom-[max(1rem,env(safe-area-inset-bottom))]",
            "sm:right-8 sm:bottom-8",
            !canChat
              ? "cursor-not-allowed bg-[#cbd5e1] text-white/50"
              : "bg-[#003580] text-white hover:bg-[#004799] hover:shadow-xl",
          ].join(" ")}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </button>
      ) : null}

      {open ? (
        <div
          className={[
            "fixed z-[46] flex w-full justify-center px-3",
            "bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
            "sm:bottom-6 sm:right-6 sm:left-auto sm:w-[360px] sm:max-w-[calc(100vw-2rem)] sm:justify-end sm:px-0 sm:pb-6 sm:pt-0",
          ].join(" ")}
        >
          <TripChatbotPanel
            tripDestination={tripDestination}
            messages={messages}
            loading={loading}
            error={error}
            input={input}
            canChat={canChat}
            trimmed={trimmed}
            onInputChange={setInput}
            onSend={() => handleSend()}
            onSendWithText={(text) => handleSend(text)}
            onClose={() => setOpen(false)}
            textareaRef={textareaRef}
            endRef={endRef}
            showStarters={showStarters}
          />
        </div>
      ) : null}
    </>
  );
}
