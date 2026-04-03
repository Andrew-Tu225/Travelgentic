"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "My Trips", dashed: true },
  { href: "/#destinations", label: "Destinations" },
];

function NavLink({ link, pathname, onNavigate, className = "" }) {
  const isActive = link.href === "/" ? pathname === "/" : pathname === link.href;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`font-sans font-semibold no-underline transition-all duration-300 ${className} ${
        link.dashed
          ? "block w-full rounded-lg border-2 border-dashed border-[#7dd3fc] px-3 py-2 text-left text-[#003580] hover:border-[#38bdf8] md:inline-block md:w-auto"
          : isActive
            ? "border-b-2 border-[#FF7D54] pb-0.5 text-[#003580]"
            : "text-[#003580]/70 hover:text-[#003580]"
      }`}
    >
      {link.label}
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white/80 px-4 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] backdrop-blur-xl sm:px-6 lg:px-12">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-sans text-lg font-bold tracking-tight text-[#003580] no-underline"
        >
          Travelgentic
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <NavLink key={link.href} link={link} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {pathname !== "/dashboard" && (
            <Link
              href="/dashboard"
              className="hidden font-sans text-[13px] font-medium text-[#003580]/70 no-underline transition-colors hover:text-[#003580] md:block"
            >
              Dashboard &rarr;
            </Link>
          )}

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#003580] transition-colors hover:bg-[#f1f5f9] md:hidden"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div
          className="fixed bottom-0 left-0 right-0 top-16 z-50 flex flex-col md:hidden"
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div className="relative max-h-[min(calc(100dvh-4rem),560px)] overflow-y-auto border-b border-[#e2e8f0] bg-white shadow-lg">
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile main">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  link={link}
                  pathname={pathname}
                  onNavigate={closeMobile}
                  className="block py-2 text-base"
                />
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
