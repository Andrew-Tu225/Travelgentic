"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";
import { fetchTripDetails, fetchPlacePhoto } from "@/lib/api";
import { motion } from "framer-motion";
import { TripChatbot } from "@/components/chatbot/TripChatbot";
import { getDestinationImage } from "@/lib/destination-images";
import { TripChecklist } from "@/components/trip/TripChecklist";
import { ActivityPlaceThumbnail } from "@/components/trip/ActivityPlaceThumbnail";

const CATEGORY_STYLES = {
  food: "bg-amber-50 text-amber-800 border-amber-200",
  culture: "bg-purple-50 text-purple-800 border-purple-200",
  nature: "bg-emerald-50 text-emerald-800 border-emerald-200",
  nightlife: "bg-pink-50 text-pink-800 border-pink-200",
  adventure: "bg-orange-50 text-orange-800 border-orange-200",
  wellness: "bg-teal-50 text-teal-800 border-teal-200",
  history: "bg-violet-50 text-violet-800 border-violet-200",
  shopping: "bg-rose-50 text-rose-800 border-rose-200",
};

const DEFAULT_TAG = "bg-[#f1f5f9] text-[#003580] border-[#e2e8f0]";

function getTagClass(tag) {
  return CATEGORY_STYLES[tag?.toLowerCase()] || DEFAULT_TAG;
}

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      try {
        const data = await fetchTripDetails(params.id);
        setTrip(data);
      } catch (err) {
        console.error("Failed to load trip:", err);
        setError("Could not load trip details.");
      }
    })();
  }, [params?.id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
          <p className="mb-4 font-sans text-[#64748b]">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="font-sans text-sm font-semibold text-[#003580] underline hover:text-[#FF7D54]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#FF7D54]" />
      </div>
    );
  }

  const city = trip.destination?.split(",")[0]?.trim() || "Destination";
  const heroTitle = `${trip.duration_days} Days in ${city}`;
  const tripId = trip.trip_id || params?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-[#F8FAFC] pb-36 font-sans text-[#001A41]"
    >
      <AppHeader />

      {/* Full-width hero */}
      <Reveal delay={0}>
        <div className="relative mb-8 w-full overflow-hidden sm:mb-10">
          <div className="relative min-h-[min(52vh,640px)] w-full sm:min-h-[min(56vh,720px)] lg:min-h-[min(58vh,780px)]">
            <Image
              src={trip.city_image_url || getDestinationImage(trip.destination)}
              alt={trip.destination || "Trip"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          </div>

          <div className="absolute inset-x-0 bottom-0 w-full pb-6 pl-3 pr-4 pt-20 text-left sm:pb-10 sm:pl-4 sm:pr-5 sm:pt-24 md:pl-5 lg:pl-6">
            <div className="flex w-full max-w-3xl flex-col items-start text-left">
              <div className="mb-3 flex flex-wrap items-center justify-start gap-3">
                <span className="rounded-full bg-[#f5e6dc] px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider text-[#5c4033]">
                  {trip.duration_days} days itinerary
                </span>
                {trip.month ? (
                  <span className="font-sans text-[13px] text-white/90">{trip.month}</span>
                ) : null}
              </div>
              <h1 className="mb-2 w-full font-sans text-[clamp(26px,5vw,40px)] font-bold leading-tight text-white">
                {heroTitle}
              </h1>
              {trip.trip_vibe ? (
                <p className="max-w-2xl font-sans text-[15px] leading-relaxed text-white/90">
                  {trip.trip_vibe}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-6xl pl-3 pr-4 sm:pl-4 sm:pr-6 lg:pl-4 lg:pr-8">
        {/* Secondary nav */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 font-sans text-sm font-medium text-[#003580] no-underline shadow-sm transition-colors hover:border-[#cbd5e1]"
          >
            ← Dashboard
          </Link>
          <Link
            href="/generate"
            className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 font-sans text-sm font-medium text-[#003580] no-underline shadow-sm transition-colors hover:border-[#cbd5e1]"
          >
            New Trip
          </Link>
        </div>

        {/* Mobile day pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {trip.itinerary.map((day) => (
            <a
              key={day.day_number}
              href={`#day-${day.day_number}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 font-sans text-[12px] text-[#64748b] no-underline shadow-sm"
            >
              <span className="font-semibold text-[#FF7D54]">{day.day_number}</span>
              <span className="max-w-[100px] truncate">{day.theme}</span>
            </a>
          ))}
        </div>

        {/* Main grid: schedule + checklist */}
        <div className="grid gap-8 lg:grid-cols-[1fr_min(100%,320px)] lg:gap-10 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="mb-8">
              <h2 className="font-sans text-2xl font-bold text-[#003580]">
                Your Journey Schedule
              </h2>
              {trip.month ? (
                <p className="mt-1 font-sans text-sm text-[#64748b]">{trip.month}</p>
              ) : null}
            </div>

            <div className="relative">
              {/* Continuous spine — centered in the left rail */}
              <div
                className="pointer-events-none absolute bottom-0 left-[11px] top-2 w-px -translate-x-1/2 bg-[#e2e8f0] sm:left-[13px]"
                aria-hidden
              />

              <div className="relative flex flex-col gap-12 sm:gap-14">
              {trip.itinerary.map((day, dayIdx) => {
                const isFirst = dayIdx === 0;

                return (
                  <Reveal key={day.day_number} delay={dayIdx * 40}>
                    <div
                      id={`day-${day.day_number}`}
                      className="relative scroll-mt-24"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <div className="relative z-[1] flex w-[22px] shrink-0 flex-col items-center pt-1.5 sm:w-[26px] sm:pt-2">
                          <div
                            className={`ring-4 ring-[#F8FAFC] ${
                              isFirst
                                ? "h-3 w-3 rounded-full border-[3px] border-[#FF7D54] bg-[#FF7D54] shadow-[0_0_0_1px_rgba(255,125,84,0.25)] sm:h-3.5 sm:w-3.5"
                                : "h-2.5 w-2.5 rounded-full border-2 border-[#cbd5e1] bg-white sm:h-3 sm:w-3"
                            }`}
                            aria-hidden
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-3 sm:mb-4">
                            <h3 className="font-sans text-lg font-bold leading-snug text-[#003580]">
                              Day {day.day_number}: {day.theme}
                            </h3>
                          </div>

                      {!day.activities?.length ? (
                        <p className="rounded-xl border border-dashed border-[#e2e8f0] bg-white/80 px-4 py-3 font-sans text-sm text-[#64748b]">
                          Upcoming activity schedule being finalized by your travel assistant…
                        </p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {day.activities.map((activity, actIdx) => {
                            const hasPlace = !!activity.place_id;
                            const tagClass = getTagClass(activity.category_tag);

                            return (
                              <div
                                key={actIdx}
                                role={hasPlace ? "button" : undefined}
                                tabIndex={hasPlace ? 0 : undefined}
                                onClick={() => hasPlace && setSelectedActivity(activity)}
                                onKeyDown={(e) => {
                                  if (hasPlace && (e.key === "Enter" || e.key === " ")) {
                                    e.preventDefault();
                                    setSelectedActivity(activity);
                                  }
                                }}
                                className={`flex gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-shadow ${
                                  hasPlace
                                    ? "cursor-pointer hover:border-[#cbd5e1] hover:shadow-md"
                                    : ""
                                }`}
                              >
                                <ActivityPlaceThumbnail
                                  placeId={activity.place_id}
                                  alt={activity.place_name}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-start justify-between gap-2">
                                    <span className="font-sans text-[13px] font-semibold text-[#FF7D54]">
                                      {activity.time_window}
                                    </span>
                                    <span className="text-[#64748b]" aria-hidden>
                                      {activity.category_tag === "food" ? "🍴" : "👁"}
                                    </span>
                                  </div>
                                  <h4 className="mb-1 font-sans text-base font-bold text-[#003580]">
                                    {activity.place_name}
                                  </h4>
                                  <p className="mb-3 font-sans text-[13px] leading-relaxed text-[#64748b]">
                                    {activity.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {activity.category_tag ? (
                                      <span
                                        className={`rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-medium ${tagClass}`}
                                      >
                                        {activity.category_tag}
                                      </span>
                                    ) : null}
                                    {activity.estimated_cost_usd ? (
                                      <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-0.5 font-sans text-[11px] font-medium text-[#64748b]">
                                        {activity.estimated_cost_usd}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <TripChecklist tripId={tripId} />
          </aside>
        </div>
      </div>

      <TripChatbot
        tripId={params?.id}
        tripDestination={trip.destination}
        onItineraryUpdate={(updatedItinerary) =>
          setTrip((prev) => (prev ? { ...prev, itinerary: updatedItinerary } : prev))
        }
      />

      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            setSelectedActivity(null);
            setPhotoUrl(null);
            setPhotoError(false);
          }}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedActivity(null);
                setPhotoUrl(null);
                setPhotoError(false);
              }}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] transition-colors hover:bg-[#e2e8f0]"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#f1f5f9]">
              <PhotoFetcher
                placeId={selectedActivity.place_id}
                onLoad={setPhotoUrl}
                onError={() => setPhotoError(true)}
              />

              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob URL
                <img
                  src={photoUrl}
                  alt={selectedActivity.place_name}
                  className="h-full w-full object-cover"
                />
              ) : photoError ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-[#64748b]">
                  <span className="mb-2 text-3xl">🏜️</span>
                  <span className="text-sm">No photo available</span>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#FF7D54]" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 p-6 pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 font-sans text-[11px] font-medium text-[#003580]">
                  {selectedActivity.time_window}
                </span>
                <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 font-sans text-[11px] font-medium text-[#64748b]">
                  {selectedActivity.estimated_cost_usd}
                </span>
              </div>

              <h3 className="font-sans text-[22px] font-bold leading-tight text-[#003580]">
                {selectedActivity.place_name}
              </h3>

              <p className="font-sans text-[14px] leading-relaxed text-[#64748b]">
                {selectedActivity.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PhotoFetcher({ placeId, onLoad, onError }) {
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const url = await fetchPlacePhoto(placeId);
        if (active) onLoad(url);
      } catch {
        if (active) onError();
      }
    })();
    return () => {
      active = false;
    };
  }, [placeId]);

  return null;
}
