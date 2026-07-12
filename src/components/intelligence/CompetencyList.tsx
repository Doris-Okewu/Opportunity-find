import type { CompetencyFocus, CompetencyKey } from '../../features/intelligence/types';

// Simple, consistent glyphs per category — purely presentational, no new
// meaning attached beyond what the category label already says.
const CATEGORY_ICON_PATHS: Record<CompetencyKey, string> = {
  technical: 'M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L4 15.5m5.75-12.396c1.499-.135 3.001-.135 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.9 15.5',
  communication: 'M8 10h8M8 14h5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  collaboration: 'M17 20h5v-1a4 4 0 0 0-4-4h-1M9 20H4v-1a4 4 0 0 1 4-4h1m0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  problemSolving: 'M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.121 12.02a5 5 0 1 1 6.486 0A4.99 4.99 0 0 0 14 19v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1a4.99 4.99 0 0 0-1.536-3.637Z',
  leadership: 'M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM5 19.5c0-3.5 3-6 7-6s7 2.5 7 6',
  domain: 'M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9Zm0 0c2.5 0 4-4 4-9s-1.5-9-4-9-4 4-4 9 1.5 9 4 9Z',
  portfolio: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5v-14Zm3-1.5v16',
  professional: 'M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm0 0V6a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2v2m4 0V6a2 2 0 0 1 2-2H16a2 2 0 0 1 2 2v2',
};

export default function CompetencyList({
  competencies,
  stageLabel,
}: {
  competencies: CompetencyFocus[];
  stageLabel?: string;
}) {
  return (
    <div>
      {stageLabel && (
        <p className="mb-3 text-xs text-ink-3">
          Ordered by priority for your current stage — <span className="font-medium text-ink-2">{stageLabel}</span>.
        </p>
      )}
      <ul className="space-y-3">
        {competencies.map((competency, i) => (
          <li key={competency.key} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-ink-3">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-ink-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORY_ICON_PATHS[competency.key]} />
                </svg>
                <p className="min-w-0 text-sm font-semibold text-ink">{competency.label}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink-2">{competency.focus}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs italic text-ink-3">
        These are competencies to strengthen, not verified gaps — Opportunity Find hasn't assessed your evidence yet.
      </p>
    </div>
  );
}
