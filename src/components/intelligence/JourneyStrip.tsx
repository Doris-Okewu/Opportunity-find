import type { JourneyStripData } from '../../features/intelligence/journeyStrip';

function Segment({
  label,
  value,
  tone,
  delayMs,
}: {
  label: string;
  value: string;
  tone: 'brand' | 'journey' | 'milestone';
  delayMs: number;
}) {
  const toneClass = { brand: 'text-brand', journey: 'text-journey', milestone: 'text-milestone' }[tone];
  return (
    <div className="animate-reveal-fade min-w-0 sm:flex-1" style={{ animationDelay: `${delayMs}ms` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <p className={`whitespace-normal break-words text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Arrow() {
  return (
    // Points down while the strip is stacked on phones, right once it is a row.
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 rotate-90 text-ink-3 sm:rotate-0" aria-hidden="true">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L13.586 10H4a1 1 0 1 1 0-2h9.586l-3.293-3.293a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * Compact orientation strip — "Current Stage -> Focus Area -> Next
 * Milestone" — meant to sit above the fuller readiness/skill content, not
 * replace it. No points, streaks, or fabricated progress; every value is
 * passed in already-derived from real onboarding-based data.
 */
export default function JourneyStrip({ data }: { data: JourneyStripData }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <Segment label="Current Stage" value={data.currentStage} tone="brand" delayMs={0} />
      <Arrow />
      <Segment label="Focus Area" value={data.focusArea} tone="journey" delayMs={80} />
      <Arrow />
      <Segment label="Next Milestone" value={data.nextMilestone} tone="milestone" delayMs={160} />
    </div>
  );
}
