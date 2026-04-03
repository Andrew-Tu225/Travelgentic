"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepDots } from "@/components/ui/StepIndicator";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { CompletionScreen } from "./CompletionScreen";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "travelgentic_onboarding";

const defaultData = {
  destination: "", origin: "", month: "", duration: "",
  purpose: "", budget: "", interests: [],
};

const TITLES = {
  step1: { h: "Plan your trip", sub: "Tell us where you're headed." },
  step2: { h: "Your vibe", sub: "Help us tailor your itinerary." },
};

export function OnboardingFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState("step1");
  const [data, setData] = useState(defaultData);

  const handleGenerate = () => {
    sessionStorage.setItem("travelgentic_pending_trip", JSON.stringify(data));
    sessionStorage.removeItem(STORAGE_KEY);
    router.push("/trip/loading");
  };

  const isStepMode = screen === "step1" || screen === "step2";

  return (
    <>
      <div className="w-full max-w-[440px] rounded-2xl border-2 border-[#e2e8f0] bg-white p-7 shadow-lg sm:p-8 font-sans">
        {/* Step header */}
        {isStepMode && (
          <div className="mb-7">
            <div className="mb-3.5 flex items-center justify-between">
              <StepDots current={screen === "step1" ? 0 : 1} />
              <span className="text-[11px] tracking-[0.05em] text-[#64748b]">
                {screen === "step1" ? "1" : "2"} / 2
              </span>
            </div>
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="mb-1 font-sans text-[24px] font-bold leading-[1.2] text-[#003580]">
                {TITLES[screen].h}
              </h1>
              <p className="text-[14px] leading-[1.5] text-[#64748b]">
                {TITLES[screen].sub}
              </p>
            </motion.div>
          </div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            {screen === "step1" && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <StepOne data={data} setData={setData} onNext={() => setScreen("step2")} />
              </motion.div>
            )}
            {screen === "step2" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <StepTwo data={data} setData={setData} onGenerate={handleGenerate} onBack={() => setScreen("step1")} quota={null} />
              </motion.div>
            )}
            {screen === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
              >
                <CompletionScreen destination={data.destination} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cost disclaimer */}
      {isStepMode && (
        <p className="mt-4 max-w-[360px] text-center font-sans text-[11px] leading-[1.6] text-[#64748b]">
          Activity cost estimates only — excludes flights, hotels &amp; transport.
        </p>
      )}
    </>
  );
}
