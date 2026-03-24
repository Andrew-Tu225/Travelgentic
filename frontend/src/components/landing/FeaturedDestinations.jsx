"use client";

import Link from "next/link";
import Image from "next/image";

const DESTINATIONS = [
  {
    href: "/destinations/bali",
    title: "Bali, Indonesia",
    subtitle: "Spiritual retreats & pristine shores.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2072",
    badge: "TRENDING",
    colSpan: 2,
    rowSpan: 2,
  },
  {
    href: "/destinations/kyoto",
    title: "Kyoto, Japan",
    subtitle: "Timeless tradition meets neon nights.",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070",
    colSpan: 2,
    rowSpan: 1,
  },
  {
    href: "/destinations/santorini",
    title: "Santorini",
    subtitle: null,
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=2032",
    colSpan: 1,
    rowSpan: 1,
  },
  {
    href: "/destinations/venice",
    title: "Venice",
    subtitle: null,
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2083",
    colSpan: 1,
    rowSpan: 1,
  },
];

export function FeaturedDestinations() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-sans text-[clamp(28px,4vw,36px)] font-bold text-[#003580]">
            Featured Destinations
          </h2>
          <p className="mt-1 font-sans text-[15px] text-[#64748b]">
            Curated by our expert editorial team and AI insights.
          </p>
        </div>
        <Link
          href="/destinations"
          className="mt-4 inline-flex items-center gap-1 font-sans text-sm font-semibold text-[#003580] no-underline transition-colors hover:text-[#FF7D54] sm:mt-0"
        >
          View All
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid gap-4 sm:min-h-[400px] sm:grid-cols-4 sm:grid-rows-2">
        {DESTINATIONS.map((dest, i) => (
          <Link
            key={dest.href}
            href={dest.href}
            className="group relative min-h-[200px] overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.02] sm:min-h-[240px]"
            style={{
              gridColumn: `span ${dest.colSpan}`,
              gridRow: `span ${dest.rowSpan}`,
            }}
          >
            <Image
              src={dest.image}
              alt={dest.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              {dest.badge && (
                <span className="mb-2 inline-block rounded-full bg-[#FF7D54] px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-white">
                  {dest.badge}
                </span>
              )}
              <h3 className="font-sans text-lg font-bold text-white sm:text-xl">
                {dest.title}
              </h3>
              {dest.subtitle && (
                <p className="mt-0.5 font-sans text-sm text-white/90">{dest.subtitle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
