"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "My Trips" },
  { href: "/generate", label: "New Trip" },
  { href: "/explore", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <>
      {/* Subtle Top Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.3)] to-transparent" />

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[rgba(16,14,11,0.8)] px-4 backdrop-blur-[10px] sm:px-6 lg:px-12">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
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

        {/* User avatar */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </header>
    </>
  );
}
