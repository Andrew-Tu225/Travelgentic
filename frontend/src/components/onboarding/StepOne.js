"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PrimaryBtn } from "@/components/ui/Button";

const SUGGESTIONS = {
  winter: [
    { city: "Kyoto", country: "Japan", emoji: "🇯🇵", tag: "Serene temples & winter gardens" },
    { city: "Marrakech", country: "Morocco", emoji: "🇲🇦", tag: "Warm souks & rooftop sunsets" },
    { city: "Reykjavik", country: "Iceland", emoji: "🇮🇸", tag: "Northern lights & hot springs" },
  ],
  spring: [
    { city: "Lisbon", country: "Portugal", emoji: "🇵🇹", tag: "Slow charm & perfect weather" },
    { city: "Amsterdam", country: "Netherlands", emoji: "🇳🇱", tag: "Tulip season & canal walks" },
    { city: "Tbilisi", country: "Georgia", emoji: "🇬🇪", tag: "Blooming hills, wine & history" },
  ],
  summer: [
    { city: "Santorini", country: "Greece", emoji: "🇬🇷", tag: "Iconic sunsets & blue domes" },
    { city: "Barcelona", country: "Spain", emoji: "🇪🇸", tag: "Beaches, tapas & Gaudí" },
    { city: "Dubrovnik", country: "Croatia", emoji: "🇭🇷", tag: "Adriatic coast & old town magic" },
  ],
  fall: [
    { city: "Tokyo", country: "Japan", emoji: "🇯🇵", tag: "Autumn leaves & street food" },
    { city: "Medellín", country: "Colombia", emoji: "🇨🇴", tag: "Vibrant, warm & affordable" },
    { city: "Prague", country: "Czech Republic", emoji: "🇨🇿", tag: "Cozy old-world charm" },
  ],
};

const FALLBACK = [
  { city: "Lisbon", country: "Portugal", emoji: "🇵🇹", tag: "Slow charm & great food" },
  { city: "Kyoto", country: "Japan", emoji: "🇯🇵", tag: "Temples, culture & zen" },
  { city: "Medellín", country: "Colombia", emoji: "🇨🇴", tag: "Vibrant, warm & affordable" },
];

const MONTH_TO_SEASON = {
  January: "winter", February: "winter", March: "spring",
  April: "spring", May: "spring", June: "summer",
  July: "summer", August: "summer", September: "fall",
  October: "fall", November: "fall", December: "winter",
};

function getSuggestions(month) {
  const season = MONTH_TO_SEASON[month];
  return season ? SUGGESTIONS[season] : FALLBACK;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DURATIONS = [3,4,5,6,7,8,9,10,12,14];

export function StepOne({ data, setData, onNext }) {
  const [showSuggest, setShowSuggest] = useState(false);
  const canContinue = data.destination && data.origin && data.month && data.duration;

  return (
    <div className="flex flex-col gap-6">
      <Reveal delay={0}>
        <Label>Where to?</Label>
        <Input
          placeholder="Enter a destination…"
          value={data.destination}
          onChange={v => setData({ ...data, destination: v })}
        />
        <button
          onClick={() => setShowSuggest(!showSuggest)}
          className="mt-2.5 flex items-center gap-[5px] border-none bg-transparent p-0 font-sans text-[13px] text-[#C8A96E] opacity-90 cursor-pointer hover:opacity-100"
        >
          <span className="text-[14px]">✦</span>
          Not sure? Help me choose
        </button>

        {showSuggest && (() => {
          const season = MONTH_TO_SEASON[data.month];
          const suggestions = getSuggestions(data.month);
          const label = season
            ? `Top picks for ${season}`
            : "Top picks — select a month for seasonal recs";
          return (
            <div className="mt-3 flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.04em] uppercase text-white/25">
                {label}
              </span>
              {suggestions.map((d, i) => (
                <Reveal key={d.city} delay={i * 60}>
                  <button
                    onClick={() => { setData({ ...data, destination: `${d.city}, ${d.country}` }); setShowSuggest(false); }}
                    className="flex w-full items-center gap-3 rounded-[10px] border-[1.5px] border-[rgba(200,169,110,0.2)] bg-[rgba(200,169,110,0.05)] p-3 text-left font-sans text-white cursor-pointer transition-colors duration-200 hover:bg-[rgba(200,169,110,0.1)]"
                  >
                    <span className="text-[26px]">{d.emoji}</span>
                    <div>
                      <div className="text-[15px] font-semibold text-white">{d.city}, {d.country}</div>
                      <div className="mt-0.5 text-[12px] text-white/40">{d.tag}</div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          );
        })()}
      </Reveal>

      <Reveal delay={60}>
        <Label>Flying from</Label>
        <Input
          placeholder="Your origin city…"
          value={data.origin}
          onChange={v => setData({ ...data, origin: v })}
        />
      </Reveal>

      <Reveal delay={120}>
        <Label>When</Label>
        <div className="flex gap-2.5">
          <Select
            value={data.month}
            onChange={v => setData({ ...data, month: v })}
            placeholder="Month"
            options={MONTHS.map(m => ({ value: m, label: m }))}
          />
          <Select
            value={data.duration}
            onChange={v => setData({ ...data, duration: v })}
            placeholder="Duration"
            options={DURATIONS.map(d => ({ value: String(d), label: `${d} days` }))}
          />
        </div>
      </Reveal>

      <Reveal delay={180}>
        <PrimaryBtn onClick={onNext} disabled={!canContinue}>
          Next →
        </PrimaryBtn>
      </Reveal>
    </div>
  );
}
