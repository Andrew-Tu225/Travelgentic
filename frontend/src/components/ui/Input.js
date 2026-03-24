"use client";

import { useState } from "react";

export function Input({ placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full rounded-lg border-2 bg-white px-4 py-3 font-sans text-[15px] text-[#001A41] outline-none transition-[border-color] duration-200 placeholder:text-[#64748b]/60 ${focused ? "border-[#FF7D54]" : "border-[#e2e8f0]"}`}
    />
  );
}
