import type { ReactNode } from 'react';

export default function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-border" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold text-ink marker:content-none transition-colors group-open:bg-surface-2">
        <span className="min-w-0 flex-1 whitespace-normal break-normal">{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180 group-open:text-brand"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      {/* Native <details> doesn't support animating open/closed height
          reliably; a plain opacity fade on the content restarts whenever
          the browser flips display none -> block, which is enough polish
          without the fragility of a height transition. */}
      <div className="animate-reveal-fade border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
