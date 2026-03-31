"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { FeaturedDestinations } from "@/components/landing/FeaturedDestinations";
import { AppHeader } from "@/components/layout/AppHeader";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Tell us your vibe",
    desc: "Where you're going, your budget, interests, and the type of experience you want.",
    iconBg: "bg-[#bae6fd]",
    icon: (
      <svg className="h-8 w-8 text-[#003580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "AI builds your plan",
    desc: "We map local gems, check the weather, and design a day-by-day schedule just for you.",
    iconBg: "bg-[#fed7aa]",
    icon: (
      <svg className="h-8 w-8 text-[#003580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Refine & share",
    desc: "Swap out days you don't love, then share a beautiful read-only link with your travel crew.",
    iconBg: "bg-[#ffedd5]",
    icon: (
      <svg className="h-8 w-8 text-[#003580]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
];

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const isMidOnboarding = sessionStorage.getItem("travelgentic_onboarding");
      if (!isMidOnboarding) {
        router.replace("/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    getToken().then((token) => {
      fetch(`${API_BASE}/api/users/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("User sync failed:", err));
    });
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#001A41]">
      <AppHeader />

      {/* ─── Hero Section ─── */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-32 lg:py-44">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2072"
            alt="Tropical coastline"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="relative z-10 mx-auto max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-sm sm:mb-6">
            <span className="text-[14px]">✦</span>
            <span className="font-sans text-[13px] font-medium text-white/95">
              The first AI-powered trip planning platform
            </span>
          </div>
          <h1 className="mb-5 font-sans text-[clamp(36px,6vw,64px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
            Travel <span className="text-[#FF7D54]">Your Way</span>
          </h1>
          <p className="mx-auto mb-10 max-w-[560px] px-2 font-sans text-[clamp(16px,2vw,18px)] leading-[1.6] text-white/95">
            Your trip, planned in seconds. Discover, plan, and explore the world&apos;s most hidden gems.
          </p>
          <a
            href="#onboarding"
            className="inline-flex rounded-lg bg-[#003580] px-8 py-4 text-base font-bold text-white no-underline shadow-lg transition-all duration-300 hover:bg-[#004799] hover:-translate-y-0.5"
          >
            Start Planning →
          </a>
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="features" className="bg-[#F8FAFC] px-4 py-24 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <h2 className="relative inline-block font-sans text-[clamp(28px,4vw,36px)] font-bold text-[#003580]">
              How It Works
              <span className="absolute -bottom-2 left-0 h-1 w-16 rounded bg-[#FF7D54]" />
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col">
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg ${step.iconBg}`}
                >
                  {step.icon}
                </div>
                <h3 className="mb-3 font-sans text-xl font-bold text-[#003580]">
                  {step.num}. {step.title}
                </h3>
                <p className="font-sans text-[15px] leading-[1.6] text-[#64748b]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Destinations ─── */}
      <section id="destinations" className="bg-[#F8FAFC] px-4 py-24 sm:px-6 lg:px-12">
        <FeaturedDestinations />
      </section>

      {/* ─── Onboarding Section ─── */}
      <section id="onboarding" className="bg-[#F8FAFC] px-4 py-24 sm:px-6 lg:py-32">
        <div className="mb-10 text-center">
          <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">
            Try It Now
          </p>
          <h2 className="mb-2 font-sans text-[clamp(24px,4vw,32px)] font-bold text-[#003580]">
            Plan your next adventure
          </h2>
          <p className="mx-auto max-w-[440px] px-2 font-sans text-[15px] leading-[1.6] text-[#64748b]">
            Fill in a few details and let our AI craft a personalized itinerary.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <OnboardingFlow />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#e2e8f0] bg-[#F8FAFC] px-4 py-10 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-sans text-sm text-[#64748b]">2026 Travelgentic</p>
        </div>
      </footer>
    </div>
  );
}
