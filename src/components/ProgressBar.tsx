'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-chocobo-gold tabular-nums">
          {current} / {total} Found
        </span>
        <span className="text-sm font-medium text-chocobo-gold tabular-nums">
          {percentage.toFixed(2)}%
        </span>
      </div>
      <div className="w-full bg-chocobo-light rounded-full h-5 border border-chocobo-gold shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]">
        <div
          className="bg-chocobo-gold h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
} 