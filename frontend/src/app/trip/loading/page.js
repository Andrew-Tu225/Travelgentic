"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { generateItinerary } from "@/lib/api";

const STAGES = [
  { label: "Analyzing your vibe", emoji: "✦", duration: 3000 },
  { label: "Finding hidden gems", emoji: "🗺️", duration: 5000 },
  { label: "Checking local favorites", emoji: "⭐", duration: 5000 },
  { label: "Scheduling your days", emoji: "📅", duration: 4000 },
  { label: "Polishing your itinerary", emoji: "✨", duration: 3000 },
];

export default function TripLoadingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState(null);
  const [destination, setDestination] = useState("");
  const apiCalled = useRef(false);

  // Cycle through visual stages
  useEffect(() => {
    if (error) return;
    if (stageIdx >= STAGES.length - 1) return;

    const timer = setTimeout(() => {
      setStageIdx((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, STAGES[stageIdx].duration);

    return () => clearTimeout(timer);
  }, [stageIdx, error]);

  // Fire API call on mount
  useEffect(() => {
    if (apiCalled.current) return;
    apiCalled.current = true;

    const raw = sessionStorage.getItem("travelgentic_pending_trip");
    if (!raw) {
      router.replace("/generate");
      return;
    }

    const tripData = JSON.parse(raw);
    setDestination(tripData.destination?.split(",")[0] || "your destination");

    (async () => {
      try {
        const token = await getToken();
        const result = await generateItinerary(tripData, token);

        // Store result and navigate
        sessionStorage.setItem("travelgentic_trip_result", JSON.stringify(result));
        sessionStorage.removeItem("travelgentic_pending_trip");
        router.replace("/trip/result");
      } catch (err) {
        console.error("Generation failed:", err);
        setError(err.message || "Something went wrong");
      }
    })();
  }, []);

  const stage = STAGES[stageIdx];
  const progress = ((stageIdx + 1) / STAGES.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#100e0b] px-4 font-sans text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_40%,rgba(200,169,110,0.1),transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center">
        {!error ? (
          <>
            {/* Pulsing orb */}
            <div className="relative mb-10">
              <div className="absolute inset-0 animate-ping rounded-full bg-[rgba(200,169,110,0.15)]" style={{ animationDuration: "2s" }} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-[rgba(200,169,110,0.3)] bg-[rgba(200,169,110,0.08)]">
                <span className="text-[32px] transition-all duration-500" key={stageIdx}>
                  {stage.emoji}
                </span>
              </div>
            </div>

            {/* Destination */}
            <h1 className="mb-3 text-center font-serif text-[clamp(22px,4vw,32px)] font-bold leading-[1.2]">
              Building your trip to{" "}
              <span className="bg-gradient-to-br from-[#C8A96E] to-[#d4b97a] bg-clip-text text-transparent">
                {destination}
              </span>
            </h1>

            {/* Stage label */}
            <p className="mb-8 text-center text-[15px] text-white/40 transition-all duration-500" key={`label-${stageIdx}`}>
              {stage.label}…
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-[280px]">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C8A96E] to-[#d4b97a] transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-white/20">
                <span>Step {stageIdx + 1} of {STAGES.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Floating hints */}
            <div className="mt-12 flex flex-col items-center gap-2">
              {["AI-powered", "Personalized", "Weather-aware"].map((tag, i) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-white/20"
                  style={{
                    animation: `float 3s ease-in-out infinite`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(-6px); opacity: 1; }
              }
            `}</style>
          </>
        ) : (
          /* Error state */
          <div className="mx-auto max-w-md rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-10 text-center backdrop-blur-[20px]">
            <div className="mb-5 text-[40px]">😔</div>
            <h2 className="mb-2 font-serif text-[22px] font-semibold text-white">
              Something went wrong
            </h2>
            <p className="mb-6 text-[14px] leading-[1.7] text-white/40">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setStageIdx(0);
                  apiCalled.current = false;
                }}
                className="cursor-pointer rounded-xl bg-gradient-to-br from-[#C8A96E] to-[#a87840] px-6 py-3 text-[14px] font-bold text-[#1a1108] border-none transition-all hover:-translate-y-0.5"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/generate")}
                className="cursor-pointer rounded-xl border-[1.5px] border-white/10 bg-transparent px-6 py-3 text-[14px] text-white/50 transition-all hover:border-white/20 hover:text-white/70"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
