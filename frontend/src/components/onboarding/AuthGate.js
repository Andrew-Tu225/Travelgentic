"use client";

import { SignIn, SignUp, Show } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Reveal } from "@/components/ui/Reveal";

export function AuthGate({ onComplete }) {
  const { isSignedIn } = useUser();

  // Auto-advance when user signs in
  useEffect(() => {
    if (isSignedIn) {
      onComplete();
    }
  }, [isSignedIn, onComplete]);

  return (
    <div>
      <Reveal delay={0}>
        <div className="mb-6 text-center">
          <div className="mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[rgba(200,169,110,0.3)] bg-[rgba(200,169,110,0.12)] text-[20px]">✦</div>
          <h2 className="mb-1.5 font-serif text-[22px] font-semibold text-white">
            Your itinerary is ready
          </h2>
          <p className="font-sans text-[14px] leading-[1.6] text-white/40">
            Sign in to view your personalized itinerary.
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex justify-center [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:border-none [&_.cl-internal-b3fm6y]:bg-transparent">
          <Show when="signed-out">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border-none p-0 gap-4",
                  headerTitle: "font-serif text-white text-lg",
                  headerSubtitle: "text-white/40 text-sm",
                  socialButtonsBlockButton: "bg-white/5 border border-white/10 text-white hover:bg-white/[0.08] transition-colors",
                  socialButtonsBlockButtonText: "text-white font-sans text-[14px]",
                  dividerLine: "bg-white/[0.08]",
                  dividerText: "text-white/25 text-[12px]",
                  formFieldLabel: "text-white/40 font-sans text-[11px] uppercase tracking-[0.12em]",
                  formFieldInput: "bg-white/5 border-white/10 text-white rounded-[10px] font-sans focus:border-[#C8A96E]",
                  formButtonPrimary: "bg-gradient-to-br from-[#C8A96E] to-[#a87840] text-[#1a1108] font-bold rounded-xl hover:from-[#d4b97a] hover:to-[#b8904f]",
                  footerActionLink: "text-[#C8A96E] hover:text-[#d4b97a]",
                  footerActionText: "text-white/30",
                  formFieldInputShowPasswordButton: "text-white/30 hover:text-white/60",
                  identityPreviewEditButton: "text-[#C8A96E]",
                },
              }}
              routing="hash"
            />
          </Show>
        </div>
      </Reveal>
    </div>
  );
}
