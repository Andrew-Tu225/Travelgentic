"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Reveal } from "@/components/ui/Reveal";

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#001A41]">
      <AppHeader />

      <main className="relative px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(0,53,128,0.07),transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_20%,rgba(255,125,84,0.06),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal delay={0}>
            <div className="mb-10 text-center">
              <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                New Trip
              </p>
              <h1 className="mb-2 font-sans text-[clamp(24px,4vw,36px)] font-bold leading-tight text-[#003580]">
                Plan your next adventure
              </h1>
              <p className="mx-auto max-w-[440px] px-2 font-sans text-[15px] leading-relaxed text-[#64748b]">
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
