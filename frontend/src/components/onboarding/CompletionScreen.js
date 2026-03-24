"use client";

import { Reveal } from "@/components/ui/Reveal";
import { PrimaryBtn } from "@/components/ui/Button";

export function CompletionScreen({ destination }) {
  return (
    <Reveal delay={0}>
      <div className="py-2 text-center">
        <div className="mb-3.5 text-[40px]">🗺️</div>
        <h2 className="mb-2 font-sans text-[22px] font-bold text-[#003580]">
          Your itinerary is ready
        </h2>
        <p className="mb-6 font-sans text-[14px] leading-[1.6] text-[#64748b]">
          We've built a day-by-day plan for {destination ? destination.split(",")[0] : "your destination"}.<br />Regenerate any day you don't love.
        </p>
        <PrimaryBtn onClick={() => {}}>View Itinerary →</PrimaryBtn>
      </div>
    </Reveal>
  );
}
