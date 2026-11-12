import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  leftLabel,
  rightLabel,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / (total || 1)) * 100));

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(leftLabel || rightLabel) && (
        <div className="flex items-center justify-between text-xs text-neutral-600">
          {leftLabel && <span className="font-bold text-neutral-900">{leftLabel}</span>}
          {rightLabel && <span>{rightLabel}</span>}
        </div>
      )}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
