"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Label";
import { PrimaryBtn, GhostBtn } from "@/components/ui/Button";

const INTERESTS = [
  { id: "food", label: "Food & Drink", icon: "🍜" },
  { id: "culture", label: "Culture & Art", icon: "🏛️" },
  { id: "nature", label: "Nature & Outdoors", icon: "🌿" },
  { id: "adventure", label: "Adventure", icon: "🧗" },
  { id: "nightlife", label: "Nightlife", icon: "🎶" },
  { id: "wellness", label: "Wellness", icon: "🧘" },
  { id: "history", label: "History", icon: "🗿" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "photography", label: "Photography", icon: "📸" },
];

const BUDGETS = [
  { id: "budget", label: "Budget", icon: "💰", sub: "Hostels & street food" },
  { id: "mid", label: "Mid-range", icon: "💳", sub: "3-star & sit-down meals" },
  { id: "comfort", label: "Comfort", icon: "✨", sub: "4-star & nice dinners" },
  { id: "luxury", label: "Luxury", icon: "👑", sub: "5-star & fine dining" },
];

export function StepTwo({ data, setData, onGenerate, onBack }) {
  const toggleInterest = (id) => {
    const sel = data.interests.includes(id)
      ? data.interests.filter(i => i !== id)
      : data.interests.length < 3 ? [...data.interests, id] : data.interests;
    setData({ ...data, interests: sel });
  };

  const canGenerate = data.purpose && data.budget && data.interests.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Reveal delay={0}>
        <Label>What's the vibe?</Label>
        <textarea
          value={data.purpose}
          onChange={e => setData({ ...data, purpose: e.target.value })}
          placeholder="e.g. 'Relaxing anniversary trip, great food and slow mornings' or 'Solo adventure, want to see as much as possible'"
          rows={3}
          className="w-full resize-none rounded-[10px] border-[1.5px] border-white/10 bg-white/5 px-4 py-[13px] font-sans text-[15px] leading-[1.6] text-white outline-none box-border transition-[border-color] duration-200 focus:border-[#C8A96E] placeholder:text-white/35"
        />
      </Reveal>

      <Reveal delay={60}>
        <Label>Budget</Label>
        <div className="grid grid-cols-2 gap-2">
          {BUDGETS.map(b => {
            const sel = data.budget === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setData({ ...data, budget: b.id })}
                className={`cursor-pointer rounded-[10px] border-[1.5px] px-3 py-3.5 text-left font-sans transition-all duration-200 ${
                  sel
                    ? "border-[#C8A96E] bg-[rgba(200,169,110,0.1)] text-[#C8A96E]"
                    : "border-white/[0.08] bg-white/[0.03] text-white/60"
                }`}
              >
                <div className="mb-1.5 text-[20px]">{b.icon}</div>
                <div className="text-[14px] font-semibold">{b.label}</div>
                <div className="mt-0.5 text-[11px] leading-[1.4] text-white/30">{b.sub}</div>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <Label>Interests <span className="font-normal normal-case tracking-normal text-white/25">— pick up to 3</span></Label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(int => {
            const sel = data.interests.includes(int.id);
            const disabled = !sel && data.interests.length >= 3;
            return (
              <button
                key={int.id}
                onClick={() => !disabled && toggleInterest(int.id)}
                className={`flex items-center gap-[5px] rounded-full border-[1.5px] px-3.5 py-2 font-sans text-[13px] transition-all duration-200 ${
                  sel
                    ? "border-[#C8A96E] bg-[rgba(200,169,110,0.12)] text-[#C8A96E] cursor-pointer"
                    : disabled
                      ? "border-white/10 bg-white/[0.03] text-white/20 cursor-not-allowed"
                      : "border-white/10 bg-white/[0.03] text-white/60 cursor-pointer"
                }`}
              >
                <span>{int.icon}</span> {int.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="flex gap-2.5">
          <GhostBtn onClick={onBack}>← Back</GhostBtn>
          <div className="flex-1">
            <PrimaryBtn onClick={onGenerate} disabled={!canGenerate}>
              ✦ Generate Itinerary
            </PrimaryBtn>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
