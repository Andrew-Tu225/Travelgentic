"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import { fetchUserStatus } from "@/lib/api";
import { StepDots } from "@/components/ui/StepIndicator";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { CompletionScreen } from "./CompletionScreen";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "travelgentic_onboarding";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const defaultData = {
  destination: "", origin: "", month: "", duration: "",
  purpose: "", budget: "", interests: [],
};

const TITLES = {
  step1: { h: "Plan your trip", sub: "Tell us where you're headed." },
  step2: { h: "Your vibe", sub: "Help us tailor your itinerary." },
};

export function OnboardingFlow() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  const [screen, setScreen] = useState("step1");
  const [data, setData] = useState(defaultData);
  const [quota, setQuota] = useState(null);

  // Fetch quota when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken()
        .then(token => fetchUserStatus(token))
        .then(status => setQuota({
          isSubscribed: status.is_subscribed,
          remaining: 5 - status.trips_generated
        }))
        .catch(err => console.error("Failed to fetch quota:", err));
    }
  }, [isLoaded, isSignedIn, getToken]);

  // After sign-in, restore saved onboarding data and sync user to backend
  useEffect(() => {
    if (!isLoaded) return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && isSignedIn) {
      setData(JSON.parse(saved));
      // Let the user stay on Step 2 and manually click Generate when ready
      setScreen("step2");

      // Scroll down to the onboarding section so the user isn't stuck at the hero section
      setTimeout(() => {
        document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Sync user to backend (fire-and-forget, don't block UI)
      getToken().then((token) => {
        fetch(`${API_BASE}/api/users/sync`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => console.error("User sync failed:", err));
      });
    }
  }, [isLoaded, isSignedIn]);

  const handleGenerate = () => {
    if (isSignedIn) {
      // Store onboarding data for the loading page to pick up
      sessionStorage.setItem("travelgentic_pending_trip", JSON.stringify(data));
      // Clean up the onboarding flag so /dashboard intercepts work normally again later
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/trip/loading");
    } else {
      // Save data, then open Clerk sign-in modal (same as "Get Started" button)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      clerk.openSignIn();
    }
  };

  // Show a spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="w-full max-w-[440px] rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-7 sm:p-8 backdrop-blur-[20px] font-sans">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-[rgba(200,169,110,0.2)] border-t-[#C8A96E] animate-spin" />
        </div>
      </div>
    );
  }

  const isStepMode = screen === "step1" || screen === "step2";

  return (
    <>
      <div className="w-full max-w-[440px] rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-7 sm:p-8 backdrop-blur-[20px] font-sans">
        {/* Step header */}
        {isStepMode && (
          <div className="mb-7">
            <div className="mb-3.5 flex items-center justify-between">
              <StepDots current={screen === "step1" ? 0 : 1} />
              <div className="flex items-center gap-3">
                {quota && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-sans text-[10px] font-medium text-[#C8A96E]">
                    <span>✦</span>
                    {quota.isSubscribed ? "Pro" : `${Math.max(0, quota.remaining)} / 5 Credits`}
                  </div>
                )}
                <span className="text-[11px] tracking-[0.05em] text-white/25">
                  {screen === "step1" ? "1" : "2"} / 2
                </span>
              </div>
            </div>
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="mb-1 font-serif text-[24px] font-semibold leading-[1.2] text-white">
                {TITLES[screen].h}
              </h1>
              <p className="text-[14px] leading-[1.5] text-white/[0.35]">
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
                <StepTwo data={data} setData={setData} onGenerate={handleGenerate} onBack={() => setScreen("step1")} quota={quota} />
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
        <p className="mt-4 max-w-[360px] text-center font-sans text-[11px] leading-[1.6] text-white/20">
          Activity cost estimates only — excludes flights, hotels &amp; transport.
        </p>
      )}
    </>
  );
}
