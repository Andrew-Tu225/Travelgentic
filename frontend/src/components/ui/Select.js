"use client";

import { useState } from "react";

export function Select({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full appearance-none rounded-[10px] border-[1.5px] bg-white/5 py-[13px] pl-4 pr-9 font-sans text-[15px] outline-none cursor-pointer transition-[border-color] duration-200 box-border ${focused ? "border-[#C8A96E]" : "border-white/10"} ${value ? "text-white" : "text-white/35"}`}
      >
        <option value="" disabled className="text-[#666]">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#1a1610] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">▾</span>
    </div>
  );
}
