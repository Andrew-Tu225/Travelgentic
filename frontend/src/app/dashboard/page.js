"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { AppHeader } from "@/components/layout/AppHeader";
import { fetchTrips } from "@/lib/api";
import { getDestinationImage } from "@/lib/destination-images";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTripDates(month, durationDays) {
  if (!month) return durationDays ? `${durationDays} days` : null;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthIdx = monthNames.indexOf(month);
  const year = new Date().getFullYear();
  if (monthIdx >= 0 && durationDays) {
    return `${monthNames[monthIdx]} ${year} · ${durationDays} days`;
  }
  return durationDays ? `${month} · ${durationDays} days` : month;
}

function getBudgetStatus(status) {
  switch (status) {
    case "generating":
      return { label: "Plan In Progress", progress: 50 };
    case "ready":
      return { label: "Ready to explore", progress: 100 };
    case "error":
      return { label: "Needs attention", progress: 0 };
    default:
      return { label: "Plan In Progress", progress: 50 };
  }
}

function getFriendlyTitle(destination, tripVibe) {
  if (tripVibe && tripVibe.length < 40) return tripVibe;
  const city = destination?.split(",")[0]?.trim() || "Adventure";
  return `${city} Getaway`;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTrips, setShowAllTrips] = useState(false);

  const firstName = user?.firstName || "Traveler";
  const displayTrips = trips.length > 4 && !showAllTrips ? trips.slice(0, 4) : trips;
  const hasMoreTrips = trips.length > 4;

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const data = await fetchTrips(token);
        setTrips(data);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#001A41]">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        {/* Header / Welcome Section */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-[#FF7D54]">
              {getGreeting().toUpperCase()}, {firstName.toUpperCase()}
            </p>
            <h1 className="mb-2 font-sans text-[clamp(28px,5vw,40px)] font-bold leading-[1.15] text-[#003580]">
              Welcome back to the horizon.
            </h1>
            <p className="max-w-xl font-sans text-[15px] leading-[1.6] text-[#64748b]">
              Your next adventure is just a few clicks away
            </p>
          </div>
          <Link
            href="/generate"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#003580] px-5 py-3.5 font-sans text-[15px] font-semibold text-white no-underline shadow-lg transition-all duration-300 hover:bg-[#004799] hover:-translate-y-0.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
              +
            </span>
            Start a New Trip
          </Link>
        </div>

        {/* Your Planned Trips Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-1 w-12 rounded bg-[#FF7D54]" />
              <h2 className="font-sans text-[clamp(22px,4vw,28px)] font-bold text-[#003580]">
                Your Planned Trips
              </h2>
            </div>
            {hasMoreTrips && !showAllTrips && (
              <button
                type="button"
                onClick={() => setShowAllTrips(true)}
                className="cursor-pointer border-none bg-transparent font-sans text-sm font-semibold text-[#003580] hover:text-[#FF7D54]"
              >
                View All
              </button>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#FF7D54]" />
            </div>
          )}

          {/* Empty state */}
          {!loading && trips.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-[#e2e8f0] bg-white p-12 text-center shadow-sm sm:p-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff7ed] text-4xl">
                🗺️
              </div>
              <h3 className="mb-2 font-sans text-xl font-bold text-[#003580]">
                No trips yet
              </h3>
              <p className="mx-auto mb-8 max-w-md font-sans text-[15px] leading-[1.6] text-[#64748b]">
                Plan your first adventure — tell us where you&apos;re headed and
                we&apos;ll craft a personalized day-by-day itinerary.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-lg bg-[#003580] px-6 py-3.5 font-sans text-[15px] font-semibold text-white no-underline shadow-lg transition-all duration-300 hover:bg-[#004799] hover:-translate-y-0.5"
              >
                <span className="text-lg">+</span>
                Generate Your First Trip
              </Link>
            </div>
          )}

          {/* Trip cards */}
          {!loading && trips.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayTrips.map((trip, i) => {
                const statusInfo = getBudgetStatus(trip.status);
                const destShort =
                  trip.destination?.split(",")[0]?.toUpperCase() || "TRIP";
                const isFirst = i === 0;

                return (
                  <Link
                    key={trip.id}
                    href={`/trip/${trip.id}`}
                    className={`group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
                      isFirst
                        ? "ring-2 ring-dashed ring-[#7dd3fc]"
                        : "ring-1 ring-[#e2e8f0] hover:ring-[#cbd5e1]"
                    }`}
                  >
                    {/* Card image */}
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={getDestinationImage(trip.destination)}
                        alt={trip.destination || "Trip"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#003580] backdrop-blur-sm">
                        {destShort}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <h3 className="mb-2 font-sans text-lg font-bold text-[#003580]">
                        {getFriendlyTitle(trip.destination, trip.trip_vibe)}
                      </h3>
                      <div className="mb-4 flex items-center gap-2 font-sans text-[13px] text-[#64748b]">
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatTripDates(trip.month, trip.duration_days) ||
                          `${trip.month || "—"} · ${trip.duration_days || "—"} days`}
                      </div>

                      <div className="border-t border-[#e2e8f0] pt-4">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                            Budget Status
                          </span>
                          <span className="font-sans text-[12px] font-semibold text-[#FF7D54]">
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#1e293b]">
                          <div
                            className="h-full rounded-full bg-[#FF7D54] transition-all duration-500"
                            style={{ width: `${statusInfo.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
