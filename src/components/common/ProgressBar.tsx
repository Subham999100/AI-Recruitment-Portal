import React from 'react';
import { cn } from '../../utils/tw';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, className, colorClass = 'bg-primary-600', showValue = false }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="flex justify-between mb-1 text-sm font-medium">
          <span className="text-gray-700">Match</span>
          <span className="text-gray-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-500 ease-out", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
