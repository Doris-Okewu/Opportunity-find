import type { SelectHTMLAttributes } from 'react';

export default function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
