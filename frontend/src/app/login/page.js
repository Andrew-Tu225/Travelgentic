"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(200,169,110,0.07),transparent_70%),#100e0b] px-4 py-8 font-sans">

      {/* Subtle top line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent" />

      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2 no-underline">
        <span className="text-base">✈</span>
        <span className="font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-white/50">
          Travelgentic
        </span>
      </Link>

      {/* Clerk Sign In */}
      <SignIn
        appearance={{
          elements: {
            card: "bg-white/[0.03] border border-white/[0.07] backdrop-blur-[20px]",
            headerTitle: "font-serif text-white",
            headerSubtitle: "text-white/40",
            formFieldInput: "bg-white/5 border-white/10 text-white",
            formButtonPrimary: "bg-gradient-to-br from-[#C8A96E] to-[#a87840] text-[#1a1108]",
            footerActionLink: "text-[#C8A96E]",
          },
        }}
        routing="hash"
      />
    </div>
  );
}
