import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: 'accent' | 'income' | 'expense' | 'warning';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
}

const colorMap = {
  accent: 'bg-accent',
  income: 'bg-income',
  expense: 'bg-expense',
  warning: 'bg-warning',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'accent',
  size = 'md',
  showLabel = false,
  label,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isOverBudget = pct >= 100;
  const effectiveColor = isOverBudget ? 'expense' : pct > 80 ? 'warning' : color;

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-zen-500">{label}</span>}
          {showLabel && (
            <span className={clsx('text-xs font-semibold', isOverBudget ? 'text-expense' : 'text-zen-600 dark:text-zen-400')}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-zen-100 dark:bg-zen-800 rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', colorMap[effectiveColor])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
