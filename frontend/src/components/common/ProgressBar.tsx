import React from 'react';
import { cn } from '../../utils/tw';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, className, colorClass = 'bg-gradient-to-r from-[#9333ea] to-[#c084fc]', showValue = false }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="flex justify-between mb-1 text-sm font-medium">
          <span className="text-gray-400">Match</span>
          <span className="text-white font-bold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
