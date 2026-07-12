import type { ReactNode } from 'react';

export default function OptionButton({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
        selected ? 'border-brand bg-brand/10 ring-1 ring-brand' : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <span className="font-semibold text-ink">{title}</span>
      {description && <span className="text-sm text-ink-2">{description}</span>}
    </button>
  );
}
