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
        <span className="text-base font-medium text-chocobo-gold">
          {current} / {total} Found
        </span>
        <span className="text-sm font-medium text-chocobo-gold">
          {percentage.toFixed(2)}%
        </span>
      </div>
      <div className="w-full bg-chocobo-light rounded-full h-4 border border-chocobo-gold">
        <div
          className="bg-chocobo-gold h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
} 