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
      className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 dark:bg-indigo-500/10'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
      {description && <span className="text-sm text-slate-500 dark:text-slate-400">{description}</span>}
    </button>
  );
}
