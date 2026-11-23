'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5 gap-2">
        <span className="font-display text-sm sm:text-base font-bold text-chocobo-gold tabular-nums">
          {current} / {total} Found
        </span>
        <span className="text-xs font-semibold text-chocobo-muted tabular-nums">
          {percentage.toFixed(1)}% &middot; {Math.max(0, total - current)} unpulled
        </span>
      </div>
      <div className="w-full bg-chocobo-recessed rounded-full h-2.5 border border-chocobo-gold/30 overflow-hidden">
        <div
          className="bg-chocobo-gold h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
