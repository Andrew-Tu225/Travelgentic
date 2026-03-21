"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, Show, useUser, useAuth } from "@clerk/nextjs";
import { fetchUserStatus } from "@/lib/api";

const authenticatedLinks = [
  { href: "/dashboard", label: "My Trips" },
  { href: "/generate", label: "New Trip" },
  { href: "/explore", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
];

const publicLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#onboarding", label: "Try It" },
  { href: "/pricing", label: "Pricing" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navLinks = isSignedIn ? authenticatedLinks : publicLinks;

  const [quota, setQuota] = useState(null);

  useEffect(() => {
    if (!isSignedIn) return;
    
    // Fetch user status for the limits badge
    getToken()
      .then(token => fetchUserStatus(token))
      .then(status => {
        setQuota({
          isSubscribed: status.is_subscribed,
          remaining: 5 - status.trips_generated
        });
      })
      .catch(err => console.error("Failed to fetch user quota:", err));
  }, [isSignedIn, getToken]);

  return (
    <>
      {/* Subtle Top Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent" />

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[rgba(16,14,11,0.8)] px-4 backdrop-blur-[10px] sm:px-6 lg:px-12">
        {/* Logo */}
        <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-2 no-underline">
          <span className="text-base">✈</span>
          <span className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/50 font-sans">
            Travelgentic
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-8 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans transition-colors duration-200 no-underline ${
                  isActive
                    ? "text-[#C8A96E]"
                    : "text-white/[0.35] hover:text-white/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Action */}
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-[#C8A96E] to-[#a87840] px-5 py-2 font-sans text-[13px] font-semibold text-[#1a1108] transition-all hover:from-[#d4b97a] hover:to-[#b8904f]">
                Get Started
              </button>
            </SignInButton>
          </Show>
          
          <Show when="signed-in">
            {/* Quota Badge */}
            {quota && (
              <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-sans text-[11px] font-medium text-[#C8A96E] sm:flex">
                <span className="text-[12px]">✦</span>
                {quota.isSubscribed ? "Pro" : `${Math.max(0, quota.remaining)} / 5 Credits`}
              </div>
            )}

            {pathname !== "/dashboard" && (
              <Link href="/dashboard" className="hidden sm:block font-sans text-[13px] font-medium text-white/50 transition-colors hover:text-white/80 no-underline">
                Dashboard &rarr;
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </Show>
        </div>
      </header>
    </>
  );
}
