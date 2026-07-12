import type { HTMLAttributes } from 'react';

/**
 * Shared surface primitive extracted from the bordered-box pattern
 * duplicated across feature pages (OpportunityCard, intelligence panels,
 * etc.). Not yet adopted by those pages — introduced now so later phases
 * have a single source of truth to migrate onto, rather than each page
 * continuing to hand-roll its own card classes.
 */
export default function Card({
  elevated = false,
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        elevated ? 'border-border-strong bg-surface-2 shadow-md' : 'border-border bg-surface shadow-sm'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
