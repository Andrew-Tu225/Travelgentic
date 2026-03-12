"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AppHeader } from "@/components/layout/AppHeader";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { fetchTripDetails, fetchPlacePhoto } from "@/lib/api";
import { motion } from "framer-motion";

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

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await fetchTripDetails(params.id, token);
        setTrip(data);
      } catch (err) {
        console.error("Failed to load trip:", err);
        setError("Could not load trip details.");
      }
    })();
  }, [params?.id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#100e0b] text-white">
        <div className="text-center">
          <p className="mb-4 text-white/50">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="text-[#C8A96E] hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#100e0b]">
        <div className="h-8 w-8 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-[#100e0b] font-sans text-white pb-32"
    >
      <AppHeader />

      {/* ─── Light/Glow Background Effects ─── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(200,169,110,0.15),transparent_70%)]" />
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

      {/* Day navigation pills (mobile) */}
      <div className="block md:hidden border-b border-white/5 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {trip.itinerary.map((day) => (
            <a
              key={day.day_number}
              href={`#day-${day.day_number}`}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/50 no-underline transition-all hover:border-[rgba(200,169,110,0.3)] hover:text-[#C8A96E]"
            >
              <span className="font-semibold text-[#C8A96E]">{day.day_number}</span>
              <span className="max-w-[100px] truncate">{day.theme}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Day columns */}
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Desktop: horizontal scroll */}
          <div className="hidden md:flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory">
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
                      const hasPlace = !!activity.place_id;
                      
                      return (
                        <div
                          key={actIdx}
                          onClick={() => hasPlace && setSelectedActivity(activity)}
                          className={`group rounded-[12px] border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 ${
                            hasPlace 
                              ? "cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.05]" 
                              : "hover:bg-white/[0.04]"
                          }`}
                        >
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
                          <h4 className="mb-1.5 text-[14px] font-semibold text-white leading-[1.3]">
                            {activity.place_name}
                          </h4>
                          <p className="mb-3 text-[12px] leading-[1.6] text-white/35">
                            {activity.description}
                          </p>
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

          {/* Mobile: vertical stack */}
          <div className="flex flex-col gap-6 md:hidden">
            {trip.itinerary.map((day, dayIdx) => (
              <Reveal key={day.day_number} delay={dayIdx * 60}>
                <div
                  id={`day-${day.day_number}`}
                  className="scroll-mt-20 rounded-[16px] border border-white/[0.07] bg-white/[0.02] backdrop-blur-[8px]"
                >
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
                      const hasPlace = !!activity.place_id;

                      return (
                        <div
                          key={actIdx}
                          onClick={() => hasPlace && setSelectedActivity(activity)}
                          className={`rounded-[12px] border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 ${
                            hasPlace ? "cursor-pointer hover:bg-white/[0.05]" : ""
                          }`}
                        >
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
                          <h4 className="mb-1.5 text-[14px] font-semibold text-white leading-[1.3]">
                            {activity.place_name}
                          </h4>
                          <p className="mb-3 text-[12px] leading-[1.6] text-white/35">
                            {activity.description}
                          </p>
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

      {/* Activity Image Modal */}
      {selectedActivity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            setSelectedActivity(null);
            setPhotoUrl(null);
            setPhotoError(false);
          }}
        >
          <div 
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto overflow-x-hidden rounded-[24px] border border-white/10 bg-[#151310] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => {
                setSelectedActivity(null);
                setPhotoUrl(null);
                setPhotoError(false);
              }}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
            >
              ✕
            </button>

            {/* Image Area */}
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-white/[0.02]">
              <PhotoFetcher 
                placeId={selectedActivity.place_id} 
                tokenFn={getToken}
                onLoad={setPhotoUrl}
                onError={() => setPhotoError(true)}
              />
              
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={selectedActivity.place_name}
                  className="h-full w-full object-cover"
                />
              ) : photoError ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-white/30">
                  <span className="mb-2 text-3xl">🏜️</span>
                  <span className="text-sm">No photo available</span>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
                </div>
              )}
            </div>

            {/* Details Area */}
            <div className="flex flex-col gap-3 p-6 pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">
                  {selectedActivity.time_window}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 flex items-center gap-1">
                  💰 {selectedActivity.estimated_cost_usd}
                </span>
              </div>
              
              <h3 className="font-serif text-[22px] font-bold text-white leading-[1.2]">
                {selectedActivity.place_name}
              </h3>
              
              <p className="text-[14px] leading-[1.6] text-white/60">
                {selectedActivity.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Inner component to handle async fetching without blocking the modal render
function PhotoFetcher({ placeId, tokenFn, onLoad, onError }) {
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await tokenFn();
        const url = await fetchPlacePhoto(placeId, token);
        if (active) onLoad(url);
      } catch (err) {
        if (active) onError();
      }
    })();
    return () => { active = false; };
  }, [placeId]);

  return null;
}
