"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Reveal } from "@/components/ui/Reveal";

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-[#100e0b] font-sans text-white">
      <AppHeader />

      <main className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(200,169,110,0.07),transparent_70%)]" />

        <div className="relative z-10">
          <Reveal delay={0}>
            <div className="mb-10 text-center">
              <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                New Trip
              </p>
              <h1 className="mb-2 font-serif text-[clamp(24px,4vw,36px)] font-semibold text-white">
                Plan your next adventure
              </h1>
              <p className="mx-auto max-w-[440px] px-2 font-sans text-[15px] leading-[1.6] text-white/[0.35]">
                Fill in a few details and let our AI craft a personalized
                itinerary.
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col items-center">
            <OnboardingFlow />
          </div>
        </div>
      </main>
    </div>
  );
}
