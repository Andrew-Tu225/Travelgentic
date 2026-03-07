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
      className={`w-full px-4 py-[13px] rounded-[10px] border-[1.5px] bg-white/5 text-[15px] font-sans text-white outline-none box-border transition-[border-color] duration-200 placeholder:text-white/35 ${focused ? "border-[#C8A96E]" : "border-white/10"}`}
    />
  );
}
