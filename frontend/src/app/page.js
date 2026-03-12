"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Show, SignInButton, UserButton, useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Sync user to backend after sign-in (fire-and-forget)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    getToken().then((token) => {
      fetch(`${API_BASE}/api/users/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("User sync failed:", err));
    });
  }, [isLoaded, isSignedIn]);
  return (
    <div className="min-h-screen bg-[#100e0b] font-sans text-white">

      {/* ─── Subtle Top Line ─── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent" />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[rgba(16,14,11,0.8)] px-4 backdrop-blur-[10px] sm:px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-base">✈</span>
          <span className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/50 font-sans">
            Travelgentic
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm text-white/[0.35] md:flex">
          <a href="#features" className="transition-colors hover:text-white/70">Features</a>
          <a href="#onboarding" className="transition-colors hover:text-white/70">Try It</a>
          <a href="#" className="transition-colors hover:text-white/70">Pricing</a>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-[#C8A96E] to-[#a87840] px-5 py-2 font-sans text-[13px] font-semibold text-[#1a1108] transition-all hover:from-[#d4b97a] hover:to-[#b8904f]">
                Get Started
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </Show>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <AuroraBackground>
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-32 lg:py-44">
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="relative z-10 mx-auto max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(200,169,110,0.2)] bg-[rgba(200,169,110,0.05)] px-4 py-2 sm:mb-8">
              <span className="text-[14px]">✦</span>
              <span className="font-sans text-[13px] text-white/50">AI-powered travel planning</span>
            </div>

            <h1 className="mb-5 font-serif text-[clamp(32px,6vw,72px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
              Your next trip,{" "}
              <span className="bg-gradient-to-br from-[#C8A96E] to-[#d4b97a] bg-clip-text text-transparent">
                planned in seconds
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-[560px] px-2 font-sans text-[clamp(15px,2vw,18px)] leading-[1.7] text-white/[0.45]">
              Tell us where you're headed, your vibe, and budget — our AI will craft a personalized day-by-day itinerary you'll actually want to follow.
            </p>

            <a href="#onboarding" className="inline-flex rounded-xl bg-gradient-to-br from-[#C8A96E] to-[#a87840] px-7 py-3.5 text-base font-bold tracking-[0.02em] text-[#1a1108] no-underline shadow-[0_8px_32px_rgba(200,169,110,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(200,169,110,0.3)]">
              Start Planning →
            </a>
          </motion.div>
        </section>
      </AuroraBackground>

      {/* ─── Features Section ─── */}
      <section id="features" className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[540px]">
          <div className="mb-10 text-center">
            <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
              How It Works
            </p>
            <h2 className="font-serif text-[clamp(24px,4vw,32px)] font-semibold text-white">
              Three steps to your perfect trip
            </h2>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-14">
            {/* Continuous gold gradient line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-0.5 rounded-sm bg-gradient-to-b from-[#C8A96E] to-[rgba(200,169,110,0.15)]" />

            {[
              { icon: "🗺️", num: "01", title: "Tell us your vibe", desc: "Where you're going, your budget, interests, and the type of experience you want." },
              { icon: "⚡", num: "02", title: "AI builds your plan", desc: "We map local gems, check the weather, and design a day-by-day schedule just for you." },
              { icon: "✦", num: "03", title: "Refine & share", desc: "Swap out days you don't love, then share a beautiful read-only link with your travel crew." },
            ].map((f, i, arr) => (
              <div key={i} className={`relative ${i < arr.length - 1 ? "mb-6" : ""}`}>
                {/* Step circle */}
                <div className="absolute -left-14 top-6 z-[2] flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C8A96E] bg-[#100e0b] font-sans text-[13px] font-bold text-[#C8A96E] shadow-[0_0_12px_rgba(200,169,110,0.15)]">
                  {f.num}
                </div>

                {/* Card */}
                <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-[8px] transition-all duration-300">
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="text-[24px]">{f.icon}</span>
                    <h3 className="m-0 font-serif text-[18px] font-semibold text-white">{f.title}</h3>
                  </div>
                  <p className="m-0 font-sans text-[14px] leading-[1.7] text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Onboarding Section ─── */}
      <section id="onboarding" className="relative bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(200,169,110,0.07),transparent_70%)] px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="mb-10 text-center">
          <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
            Try It Now
          </p>
          <h2 className="mb-2 font-serif text-[clamp(24px,4vw,32px)] font-semibold text-white">
            Plan your next adventure
          </h2>
          <p className="mx-auto max-w-[440px] px-2 font-sans text-[15px] leading-[1.6] text-white/[0.35]">
            Fill in a few details and let our AI craft a personalized itinerary.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <OnboardingFlow />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 px-4 py-10 text-center sm:px-6 sm:py-12">
        <Link href="/" className="mb-4 flex items-center justify-center gap-2 no-underline">
          <span className="text-[14px]">✈</span>
          <span className="font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-white/30">Travelgentic</span>
        </Link>
        <p className="font-sans text-[12px] text-white/20">
          © 2026 Travelgentic. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
