import { useEffect, useState } from 'react';
import type { MatchScoreResult, MatchStrength } from '../../features/intelligence/types';
import Badge from '../ui/Badge';

const STRENGTH_TONE: Record<MatchStrength, 'green' | 'indigo' | 'amber' | 'default'> = {
  'Strong Match': 'green',
  'Good Match': 'indigo',
  'Possible Match': 'amber',
  Explore: 'default',
};

// CSS variables, not Tailwind classes — these feed an SVG `stroke` attribute,
// which needs an actual color value. Kept in step with STRENGTH_TONE above.
const STRENGTH_RING_COLOR: Record<MatchStrength, string> = {
  'Strong Match': 'var(--color-success)',
  'Good Match': 'var(--color-brand)',
  'Possible Match': 'var(--color-milestone)',
  Explore: 'var(--color-ink-3)',
};

/**
 * Ring fills from empty to the calculated percentage once, on mount, via a
 * plain CSS transition on strokeDashoffset — no library. The numeric
 * percentage text is static (never counts up) to keep this simple, per the
 * "keep the number static if counting adds complexity" guidance. Under
 * prefers-reduced-motion, the global rule in index.css collapses the
 * transition duration to ~0ms, so the ring lands on its final value
 * immediately instead of animating.
 */
function MatchRing({ percentage, strengthLabel, size }: { percentage: number | null; strengthLabel: MatchStrength; size: number }) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = percentage ?? 0;
  const targetOffset = circumference * (1 - pct / 100);
  const offset = filled ? targetOffset : circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`Estimated match ${percentage !== null ? `${percentage}%` : 'not available'}, ${strengthLabel}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      {percentage !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STRENGTH_RING_COLOR[strengthLabel]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-ink)"
        fontSize={size * 0.24}
        fontWeight="700"
      >
        {percentage !== null ? `${percentage}%` : 'N/A'}
      </text>
    </svg>
  );
}

export default function MatchScorePanel({ match, compact = false }: { match: MatchScoreResult; compact?: boolean }) {
  const reasons = compact ? match.matchReasons.slice(0, 3) : match.matchReasons;
  const checks = compact ? match.thingsToCheck.slice(0, 2) : match.thingsToCheck;

  return (
    <div>
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
        <MatchRing percentage={match.percentage} strengthLabel={match.strengthLabel} size={compact ? 56 : 80} />
        <div className="min-w-0 w-full sm:w-auto sm:flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">Estimated Match</p>
          <Badge tone={STRENGTH_TONE[match.strengthLabel]}>{match.strengthLabel}</Badge>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-ink-2">Why this matches</p>
          <ul className="space-y-1">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-1.5 text-sm text-ink-2">
                <span aria-hidden className="text-success">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {checks.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-ink-2">Things to check</p>
          <ul className="space-y-1">
            {checks.map((item) => (
              <li key={item} className="flex gap-1.5 text-sm text-milestone">
                <span aria-hidden>!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && match.unassessedNote && <p className="mt-3 text-xs text-ink-3">{match.unassessedNote}</p>}

      {!compact && <p className="mt-3 text-xs italic text-ink-3">{match.disclaimer}</p>}
    </div>
  );
}
