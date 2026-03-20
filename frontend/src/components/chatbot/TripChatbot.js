"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { sendTripChat } from "@/lib/api";

function Spinner({ className }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 border-white/[0.25] border-t-[#C8A96E] ${className || ""}`}
    />
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "whitespace-pre-wrap break-words rounded-[14px] px-3 py-2 text-[13px] leading-[1.5] border",
          isUser
            ? "ml-8 max-w-[85%] bg-[#C8A96E]/15 border-[#C8A96E]/25 text-white/85"
            : "mr-8 max-w-[85%] bg-white/[0.06] border-white/[0.08] text-white/70",
        ].join(" ")}
      >
        {content}
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
  onClose,
  textareaRef,
  endRef,
}) {
  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-white/[0.10] bg-[#151310]/95 backdrop-blur-[18px] shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C8A96E]/25 bg-[#C8A96E]/10 text-[#C8A96E]">
              ✦
            </span>
            <p className="truncate font-sans text-[13px] font-semibold text-white/80">
              Trip assistant
            </p>
          </div>
          {tripDestination ? (
            <p className="truncate mt-0.5 text-[11px] text-white/40">{tripDestination}</p>
          ) : null}
        </div>

        {onClose ? (
          <button
            type="button"
            aria-label="Close trip assistant"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/60 transition-colors hover:border-white/[0.16] hover:text-white/85"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="max-h-[66vh] overflow-y-auto px-3 py-3">
        {messages.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            {messages.map((m, idx) => (
              <MessageBubble key={`${m.role}-${idx}`} role={m.role} content={m.content} />
            ))}
          </div>
        )}

        {loading ? (
          <div className="mt-2">
            <div className="flex justify-start">
              <div className="mr-8 max-w-[85%] rounded-[14px] border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-[13px] text-white/70">
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span>Assistant is thinking…</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 px-2 text-[12px] text-red-300/70">{error}</p> : null}

        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.08] bg-[rgba(16,14,11,0.35)] px-3 py-3">
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
            className="min-h-[46px] w-full resize-none rounded-[12px] border-[1.5px] border-white/10 bg-white/5 px-4 py-[12px] text-[14px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#C8A96E]"
          />

          <button
            type="button"
            disabled={loading || !canChat || !trimmed}
            onClick={onSend}
            className={[
              "flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border-none text-[#1a1108] transition-all duration-200",
              "bg-gradient-to-br from-[#C8A96E] to-[#a87840] hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(200,169,110,0.25)]",
              loading || !canChat || !trimmed
                ? "opacity-45 cursor-not-allowed hover:translate-y-0 hover:shadow-none"
                : "",
            ].join(" ")}
          >
            {loading ? <Spinner className="h-4 w-4" /> : <span className="text-[16px]">➤</span>}
          </button>
        </div>

        <p className="mt-2 px-1 text-[11px] text-white/35">
          Tip: press `Enter` to send, `Shift+Enter` for a new line.
        </p>
      </div>
    </div>
  );
}

export function TripChatbot({ tripId, tripDestination, onItineraryUpdate }) {
  const { getToken } = useAuth();
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
    ? `Hi! I can help refine your itinerary for ${tripDestination}. Ask me to adjust days, swap activities, or optimize timing.`
    : "Hi! I can help refine your itinerary. Ask me to adjust days, swap activities, or optimize timing.";

  // Seed a friendly assistant message once per page-load (when the panel opens).
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

    // Keep the latest assistant reply in view only after user sends.
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

  async function handleSend() {
    if (!canChat || loading) return;
    const messageText = input.trim();
    if (!messageText) return;

    shouldAutoScrollRef.current = true;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("You must be signed in to chat.");
      const result = await sendTripChat(tripId, messageText, token);

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
      {/* Floating action button (desktop + mobile) */}
      {!open ? (
        <button
          type="button"
          aria-label="Open trip assistant"
          onClick={() => {
            setOpen(true);
          }}
          disabled={!canChat}
          className={[
            "fixed z-[45] flex items-center justify-center rounded-full border backdrop-blur-[12px] transition-all duration-200",
            "h-[56px] w-[56px] right-6 bottom-6",
            "sm:right-8 sm:bottom-8",
            !canChat
              ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
              : "border-white/[0.08] bg-[#151310]/90 text-white/80 hover:border-white/[0.16] hover:bg-[#151310]/95 hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]",
          ].join(" ")}
        >
          <span className="text-[20px] leading-none">✦</span>
        </button>
      ) : null}

      {/* Floating panel (desktop + mobile) */}
      {open ? (
        <div className="fixed bottom-6 right-6 z-[46] w-[360px] max-w-[calc(100vw-2rem)]">
          <TripChatbotPanel
            tripDestination={tripDestination}
            messages={messages}
            loading={loading}
            error={error}
            input={input}
            canChat={canChat}
            trimmed={trimmed}
            onInputChange={setInput}
            onSend={handleSend}
            onClose={() => setOpen(false)}
            textareaRef={textareaRef}
            endRef={endRef}
          />
        </div>
      ) : null}
    </>
  );
}

