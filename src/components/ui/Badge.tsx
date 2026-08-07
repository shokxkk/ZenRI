import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-income-light dark:bg-income-dark/40 text-income',
  danger: 'bg-expense-light dark:bg-expense-dark/40 text-expense',
  warning: 'bg-warning-light dark:bg-warning-dark/40 text-warning',
  info: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  neutral: 'bg-zen-100 dark:bg-zen-800 text-zen-600 dark:text-zen-400',
  accent: 'bg-accent-light dark:bg-accent-dark/40 text-accent',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, size = 'sm' }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  );
};
