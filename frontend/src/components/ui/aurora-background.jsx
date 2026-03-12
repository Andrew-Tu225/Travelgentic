"use client";
import { cn } from "@/lib/utils";
import React from "react";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-[#100e0b] text-white transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,#100e0b_0%,#1a1610_7%,var(--transparent)_10%,var(--transparent)_12%,#100e0b_16%)]
            
            /* SWAPPED DEFAULT COLORS FOR TRAVELGENTIC BRAND COLORS */
            [--aurora:repeating-linear-gradient(100deg,rgba(200,169,110,0.4)_10%,rgba(168,120,64,0.3)_15%,rgba(212,185,122,0.4)_20%,rgba(200,169,110,0.2)_25%,rgba(200,169,110,0.5)_30%)]
            
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[20px] 
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-lighten
            pointer-events-none
            absolute -inset-[10px] opacity-40 will-change-transform`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
          ></div>
        </div>
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </main>
  );
};
