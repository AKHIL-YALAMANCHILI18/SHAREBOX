import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  size?: 'sm' | 'md';
}

export function Progress({ value, size = 'sm', className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div
      className={cn(
        'w-full bg-zinc-100 rounded-full overflow-hidden',
        heights[size],
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
