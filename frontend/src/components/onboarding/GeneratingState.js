"use client";

import { useState, useEffect } from "react";

export function GeneratingState({ destination }) {
  const steps = [
    "Mapping your destination…",
    "Curating local gems…",
    "Checking the weather…",
    "Building your day-by-day plan…",
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const intervals = steps.map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * 900)
    );
    return () => intervals.forEach(clearTimeout);
  }, []);

  return (
    <div className="py-4 text-center">
      <div className="mb-7">
        <div className="mx-auto h-14 w-14 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
      </div>
      <h2 className="mb-2 font-serif text-[22px] font-semibold text-white">
        Planning your trip to {destination ? destination.split(",")[0] : "your destination"}
      </h2>
      <div className="relative flex h-10 items-center justify-center">
        {steps.map((s, i) => (
          <p
            key={i}
            className={`absolute m-0 font-sans text-[14px] text-white/[0.45] transition-all duration-400 ease-out ${
              currentStep === i ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
            }`}
          >{s}</p>
        ))}
      </div>
    </div>
  );
}
