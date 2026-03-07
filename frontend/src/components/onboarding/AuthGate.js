"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Input } from "@/components/ui/Input";
import { PrimaryBtn } from "@/components/ui/Button";

export function AuthGate({ onComplete }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <Reveal delay={0}>
        <div className="mb-7 text-center">
          <div className="mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[rgba(200,169,110,0.3)] bg-[rgba(200,169,110,0.12)] text-[20px]">✦</div>
          <h2 className="mb-1.5 font-serif text-[22px] font-semibold text-white">
            {mode === "signup" ? "Your itinerary is ready" : "Welcome back"}
          </h2>
          <p className="font-sans text-[14px] leading-[1.6] text-white/40">
            {mode === "signup"
              ? "Create a free account to view it."
              : "Log in to see your itinerary."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <button
          onClick={onComplete}
          className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border-[1.5px] border-white/10 bg-white/5 px-4 py-[13px] font-sans text-[14px] text-white transition-colors duration-200 hover:bg-white/[0.08]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </Reveal>

      <Reveal delay={120}>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="font-sans text-[12px] text-white/25">or</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Input placeholder="Email" value={email} onChange={setEmail} />
          <Input placeholder="Password" value={password} onChange={setPassword} type="password" />
        </div>

        <div className="mt-4">
          <PrimaryBtn onClick={onComplete} disabled={!email || !password}>
            {mode === "signup" ? "Create account & view itinerary" : "Log in & view itinerary"}
          </PrimaryBtn>
        </div>

        <p className="mt-4 text-center font-sans text-[13px] text-white/30">
          {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="cursor-pointer border-none bg-transparent p-0 font-sans text-[13px] text-[#C8A96E]"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </Reveal>
    </div>
  );
}
