import React from 'react';
import { cn } from '../../utils/tw';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('bg-[rgba(17,10,27,0.75)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl text-white', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-white/10', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-lg font-bold text-white', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-4 text-gray-300', className)}>
      {children}
    </div>
  );
}
