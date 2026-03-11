"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AppHeader } from "@/components/layout/AppHeader";
import { Reveal } from "@/components/ui/Reveal";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch real trips from backend
    // For now, simulate an empty state
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#100e0b] font-sans text-white">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {/* Page title */}
        <Reveal delay={0}>
          <div className="mb-10">
            <p className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
              Dashboard
            </p>
            <h1 className="font-serif text-[clamp(28px,5vw,40px)] font-bold leading-[1.15] text-white">
              Your Trips
            </h1>
          </div>
        </Reveal>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <Reveal delay={80}>
            <div className="mx-auto max-w-md rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-10 text-center backdrop-blur-[20px]">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-[rgba(200,169,110,0.25)] bg-[rgba(200,169,110,0.08)] text-[28px]">
                🗺️
              </div>

              <h2 className="mb-2 font-serif text-[22px] font-semibold text-white">
                No trips yet
              </h2>
              <p className="mb-7 font-sans text-[14px] leading-[1.7] text-white/40">
                Plan your first adventure — tell us where you're headed and
                we'll craft a personalized day-by-day itinerary.
              </p>

              <Link
                href="/generate"
                className="inline-flex rounded-xl bg-gradient-to-br from-[#C8A96E] to-[#a87840] px-7 py-3.5 text-[15px] font-bold tracking-[0.02em] text-[#1a1108] no-underline shadow-[0_8px_32px_rgba(200,169,110,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(200,169,110,0.3)]"
              >
                Generate Your First Trip →
              </Link>
            </div>
          </Reveal>
        )}

        {/* Trip cards grid (when trips exist) */}
        {!loading && trips.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <Reveal key={trip.id || i} delay={i * 60}>
                <div className="group relative rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-[12px] transition-all duration-300 hover:border-[rgba(200,169,110,0.2)] hover:bg-white/[0.05]">
                  {/* Accent line */}
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[24px]">✈</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-sans text-[11px] text-white/40">
                      {trip.duration || "—"} days
                    </span>
                  </div>

                  <h3 className="mb-1 font-serif text-[18px] font-semibold text-white">
                    {trip.destination || "Untitled Trip"}
                  </h3>
                  <p className="mb-4 font-sans text-[13px] text-white/35">
                    {trip.month || ""} · {trip.purpose || ""}
                  </p>

                  <div className="flex items-center gap-2 font-sans text-[13px] text-[#C8A96E] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    View itinerary
                    <span className="translate-x-0 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
