"use client";

import { useState } from "react";

export function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl p-[15px] font-sans text-[15px] font-bold tracking-[0.02em] transition-all duration-200 border-none ${
        disabled
          ? "cursor-not-allowed bg-[rgba(200,169,110,0.2)] text-white/25"
          : "cursor-pointer text-[#1a1108] bg-gradient-to-br from-[#C8A96E] to-[#a87840] hover:-translate-y-[1px] hover:from-[#d4b97a] hover:to-[#b8904f] hover:shadow-[0_8px_24px_rgba(200,169,110,0.25)]"
      }`}
    >{children}</button>
  );
}

export function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-xl border-[1.5px] border-white/[0.08] bg-transparent px-5 py-[15px] font-sans text-[15px] text-white/40 transition-colors duration-200 cursor-pointer hover:border-white/20 hover:text-white/70"
    >{children}</button>
  );
}
