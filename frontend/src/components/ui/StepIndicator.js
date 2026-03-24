export function StepDots({ current }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1].map(i => (
        <div key={i} className={`h-[3px] rounded-sm transition-all duration-[350ms] ease-in-out ${
          i === current
            ? "w-7 bg-[#FF7D54]"
            : i < current
              ? "w-3 bg-[#FF7D54]/50"
              : "w-3 bg-[#e2e8f0]"
        }`} />
      ))}
    </div>
  );
}
