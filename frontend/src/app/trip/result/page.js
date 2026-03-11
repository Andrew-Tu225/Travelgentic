"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";

const CATEGORY_COLORS = {
  food: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "#f59e0b" },
  culture: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", text: "#a855f7" },
  nature: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)", text: "#22c55e" },
  nightlife: { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.25)", text: "#ec4899" },
  adventure: { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)", text: "#f97316" },
  wellness: { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.25)", text: "#14b8a6" },
  history: { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", text: "#8b5cf6" },
  shopping: { bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.25)", text: "#f472b6" },
};

const DEFAULT_COLOR = { bg: "rgba(200,169,110,0.12)", border: "rgba(200,169,110,0.25)", text: "#C8A96E" };

function getCategoryColor(tag) {
  return CATEGORY_COLORS[tag?.toLowerCase()] || DEFAULT_COLOR;
}

export default function TripResultPage() {
  const router = useRouter();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("travelgentic_trip_result");
    if (!raw) {
      router.replace("/dashboard");
      return;
    }
    setTrip(JSON.parse(raw));
  }, []);

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#100e0b]">
        <div className="h-8 w-8 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100e0b] font-sans text-white">
      <AppHeader />

      {/* Trip header */}
      <div className="border-b border-white/5 px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Reveal delay={0}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                  Your Itinerary
                </p>
                <h1 className="font-serif text-[clamp(28px,5vw,42px)] font-bold leading-[1.1]">
                  <span className="bg-gradient-to-br from-[#C8A96E] to-[#d4b97a] bg-clip-text text-transparent">
                    {trip.destination}
                  </span>
                </h1>
                <p className="mt-2 max-w-xl text-[14px] leading-[1.7] text-white/40">
                  {trip.trip_vibe}
                </p>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: trip.month, icon: "📅" },
                  { label: `${trip.duration_days} days`, icon: "⏱" },
                  { label: trip.budget, icon: "💰" },
                ].map((badge) => (
                  <span
                    key={badge.label}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/50"
                  >
                    <span>{badge.icon}</span> {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Actions */}
          <Reveal delay={60}>
            <div className="mt-6 flex gap-3">
              <Link
                href="/generate"
                className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-white/10 bg-transparent px-4 py-2.5 text-[13px] text-white/50 no-underline transition-all hover:border-white/20 hover:text-white/70"
              >
                ✦ New Trip
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-white/10 bg-transparent px-4 py-2.5 text-[13px] text-white/50 no-underline transition-all hover:border-white/20 hover:text-white/70"
              >
                ← My Trips
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Day columns — horizontal scroll */}
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin">
            {trip.itinerary.map((day, dayIdx) => (
              <Reveal key={day.day_number} delay={dayIdx * 80}>
                <div className="w-[320px] min-w-[320px] snap-start flex-shrink-0 rounded-[16px] border border-white/[0.07] bg-white/[0.02] backdrop-blur-[8px]">
                  {/* Day header */}
                  <div className="border-b border-white/[0.06] p-5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#C8A96E] text-[12px] font-bold text-[#C8A96E]">
                        {day.day_number}
                      </span>
                      <span className="text-[11px] text-white/25">
                        {day.activities?.length || 0} activities
                      </span>
                    </div>
                    <h3 className="font-serif text-[16px] font-semibold text-white leading-[1.3]">
                      {day.theme}
                    </h3>
                  </div>

                  {/* Activity cards */}
                  <div className="flex flex-col gap-3 p-4">
                    {day.activities?.map((activity, actIdx) => {
                      const color = getCategoryColor(activity.category_tag);
                      return (
                        <div
                          key={actIdx}
                          className="group rounded-[12px] border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]"
                        >
                          {/* Time + category */}
                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="text-[12px] font-medium text-white/50">
                              {activity.time_window}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: color.bg,
                                border: `1px solid ${color.border}`,
                                color: color.text,
                              }}
                            >
                              {activity.category_tag}
                            </span>
                          </div>

                          {/* Place name */}
                          <h4 className="mb-1.5 text-[14px] font-semibold text-white leading-[1.3]">
                            {activity.place_name}
                          </h4>

                          {/* Description */}
                          <p className="mb-3 text-[12px] leading-[1.6] text-white/35">
                            {activity.description}
                          </p>

                          {/* Cost */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-white/25">💰</span>
                            <span className="text-[11px] text-white/30">
                              {activity.estimated_cost_usd}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
