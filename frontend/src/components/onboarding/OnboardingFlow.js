"use client";

import { useState } from "react";
import { StepDots } from "@/components/ui/StepIndicator";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { GeneratingState } from "./GeneratingState";
import { AuthGate } from "./AuthGate";
import { CompletionScreen } from "./CompletionScreen";

const defaultData = {
  destination: "", origin: "", month: "", duration: "",
  purpose: "", budget: "", interests: [],
};

const TITLES = {
  step1: { h: "Plan your trip", sub: "Tell us where you're headed." },
  step2: { h: "Your vibe", sub: "Help us tailor your itinerary." },
};

export function OnboardingFlow() {
  const [screen, setScreen] = useState("step1");
  const [data, setData] = useState(defaultData);

  const handleGenerate = () => {
    setScreen("generating");
    setTimeout(() => setScreen("auth"), 3800);
  };

  const isStepMode = screen === "step1" || screen === "step2";

  return (
    <>
      <div className="w-full max-w-[440px] rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-7 sm:p-8 backdrop-blur-[20px] font-sans">
        {/* Step header */}
        {isStepMode && (
          <div className="mb-7">
            <div className="mb-3.5 flex items-center justify-between">
              <StepDots current={screen === "step1" ? 0 : 1} />
              <span className="text-[11px] tracking-[0.05em] text-white/25">
                {screen === "step1" ? "1" : "2"} / 2
              </span>
            </div>
            <h1 className="mb-1 font-serif text-[24px] font-semibold leading-[1.2] text-white">
              {TITLES[screen].h}
            </h1>
            <p className="text-[14px] leading-[1.5] text-white/[0.35]">
              {TITLES[screen].sub}
            </p>
          </div>
        )}

        {screen === "step1" && <StepOne data={data} setData={setData} onNext={() => setScreen("step2")} />}
        {screen === "step2" && <StepTwo data={data} setData={setData} onGenerate={handleGenerate} onBack={() => setScreen("step1")} />}
        {screen === "generating" && <GeneratingState destination={data.destination} />}
        {screen === "auth" && <AuthGate onComplete={() => setScreen("done")} />}
        {screen === "done" && <CompletionScreen destination={data.destination} />}
      </div>

      {/* Cost disclaimer */}
      {isStepMode && (
        <p className="mt-4 max-w-[360px] text-center font-sans text-[11px] leading-[1.6] text-white/20">
          Activity cost estimates only — excludes flights, hotels & transport.
        </p>
      )}
    </>
  );
}
