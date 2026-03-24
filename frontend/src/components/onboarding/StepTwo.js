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

export function StepTwo({ data, setData, onGenerate, onBack, quota }) {
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
          className="w-full resize-none rounded-lg border-2 border-[#e2e8f0] bg-white px-4 py-3 font-sans text-[15px] leading-[1.6] text-[#001A41] outline-none transition-[border-color] duration-200 focus:border-[#FF7D54] placeholder:text-[#64748b]/60"
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
                className={`cursor-pointer rounded-lg border-2 px-3 py-3.5 text-left font-sans transition-all duration-200 ${sel
                    ? "border-[#FF7D54] bg-[#fff7ed] text-[#003580]"
                    : "border-[#e2e8f0] bg-white text-[#64748b]"
                  }`}
              >
                <div className="mb-1.5 text-[20px]">{b.icon}</div>
                <div className="text-[14px] font-semibold">{b.label}</div>
                <div className="mt-0.5 text-[11px] leading-[1.4] text-[#64748b]">{b.sub}</div>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <Label>Interests <span className="font-normal normal-case tracking-normal text-[#64748b]">— pick up to 3</span></Label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(int => {
            const sel = data.interests.includes(int.id);
            const disabled = !sel && data.interests.length >= 3;
            return (
              <button
                key={int.id}
                onClick={() => !disabled && toggleInterest(int.id)}
                className={`flex items-center gap-[5px] rounded-full border-2 px-3.5 py-2 font-sans text-[13px] transition-all duration-200 ${sel
                    ? "cursor-pointer border-[#FF7D54] bg-[#fff7ed] text-[#003580]"
                    : disabled
                      ? "cursor-not-allowed border-[#e2e8f0] bg-[#f1f5f9] text-[#94a3b8]"
                      : "cursor-pointer border-[#e2e8f0] bg-white text-[#64748b]"
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
              <span className="flex w-full items-center justify-center gap-2">
                <span>✦ Generate Itinerary</span>
                {quota && !quota.isSubscribed && (
                  <span className="font-normal text-[13px] text-[#64748b]">
                    ({Math.max(0, quota.remaining)} left)
                  </span>
                )}
              </span>
            </PrimaryBtn>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
