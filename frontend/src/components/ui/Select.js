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
        className={`w-full cursor-pointer appearance-none rounded-lg border-2 bg-white py-3 pl-4 pr-9 font-sans text-[15px] outline-none transition-[border-color] duration-200 ${focused ? "border-[#FF7D54]" : "border-[#e2e8f0]"} ${value ? "text-[#001A41]" : "text-[#64748b]/60"}`}
      >
        <option value="" disabled className="text-[#64748b]">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white text-[#001A41]">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#64748b]">▾</span>
    </div>
  );
}
