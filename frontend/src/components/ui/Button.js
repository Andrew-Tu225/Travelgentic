"use client";

import { useState } from "react";

export function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg border-none p-4 font-sans text-[15px] font-bold tracking-[0.02em] transition-all duration-300 ${
        disabled
          ? "cursor-not-allowed bg-[#cbd5e1] text-[#64748b]"
          : "cursor-pointer bg-[#003580] text-white hover:-translate-y-0.5 hover:bg-[#004799]"
      }`}
    >{children}</button>
  );
}

export function GhostBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer whitespace-nowrap rounded-lg border-2 border-[#e2e8f0] bg-transparent px-5 py-4 font-sans text-[15px] text-[#64748b] transition-colors duration-300 hover:border-[#003580] hover:text-[#003580]"
    >{children}</button>
  );
}
