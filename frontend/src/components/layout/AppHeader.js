"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, SignUpButton, Show, useUser, useAuth } from "@clerk/nextjs";
import { fetchUserStatus } from "@/lib/api";

const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/#onboarding", label: "My Trips", dashed: true },
  { href: "/#destinations", label: "Destinations" },
  { href: "/#", label: "Pricing" },
];

const authenticatedNavLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "My Trips", dashed: true },
  { href: "/#destinations", label: "Destinations" },
  { href: "/#", label: "Pricing" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navLinks = isSignedIn ? authenticatedNavLinks : publicNavLinks;

  const [quota, setQuota] = useState(null);

  useEffect(() => {
    if (!isSignedIn) return;

    getToken()
      .then((token) => fetchUserStatus(token))
      .then((status) => {
        setQuota({
          isSubscribed: status.is_subscribed,
          remaining: 5 - status.trips_generated,
        });
      })
      .catch((err) => console.error("Failed to fetch user quota:", err));
  }, [isSignedIn, getToken]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white/80 px-4 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] backdrop-blur-xl sm:px-6 lg:px-12">
      {/* Logo */}
      <Link
        href={isSignedIn ? "/dashboard" : "/"}
        className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight text-[#003580] no-underline"
      >
        Travelgentic
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-8 text-sm">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-sans font-semibold no-underline transition-all duration-300 ${
                link.dashed
                  ? "rounded-lg border-2 border-dashed border-[#7dd3fc] px-3 py-1.5 text-[#003580] hover:border-[#38bdf8]"
                  : isActive
                    ? "border-b-2 border-[#FF7D54] pb-0.5 text-[#003580]"
                    : "text-[#003580]/70 hover:text-[#003580]"
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
            <button className="cursor-pointer rounded-lg border-2 border-dashed border-[#7dd3fc] bg-transparent px-4 py-2 font-sans text-sm font-semibold text-[#003580] transition-all duration-300 hover:border-[#38bdf8]">
              Login
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="cursor-pointer rounded-lg border-none bg-[#003580] px-4 py-2 font-sans text-sm font-semibold text-white transition-all duration-300 hover:bg-[#004799]">
              Sign Up
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          {quota && (
            <div className="hidden items-center gap-1.5 rounded-full border border-[#7dd3fc] bg-[#f0f9ff] px-2.5 py-1 font-sans text-[11px] font-medium text-[#003580] sm:flex">
              <span className="text-[12px]">✦</span>
              {quota.isSubscribed
                ? "Pro"
                : `${Math.max(0, quota.remaining)} / 5 Credits`}
            </div>
          )}

          {pathname !== "/dashboard" && (
            <Link
              href="/dashboard"
              className="hidden font-sans text-[13px] font-medium text-[#003580]/70 no-underline transition-colors hover:text-[#003580] sm:block"
            >
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
  );
}
