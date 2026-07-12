import type { PreparationFocusArea } from '../../features/intelligence/types';

export default function PreparationFocusList({
  areas,
  urgent = false,
}: {
  areas: PreparationFocusArea[];
  /** Ties the numbering accent to deadline urgency without altering content. */
  urgent?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {areas.map((area, i) => (
        <li key={area.title} className="flex gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              urgent ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-ink-3'
            }`}
          >
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{area.title}</p>
            <p className="text-sm text-ink-2">{area.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
