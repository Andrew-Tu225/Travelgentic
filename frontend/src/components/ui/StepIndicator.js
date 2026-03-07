export function StepDots({ current }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1].map(i => (
        <div key={i} className={`h-[3px] rounded-sm transition-all duration-[350ms] ease-in-out ${
          i === current
            ? "w-7 bg-[#C8A96E]"
            : i < current
              ? "w-3 bg-[rgba(200,169,110,0.4)]"
              : "w-3 bg-white/[0.12]"
        }`} />
      ))}
    </div>
  );
}
