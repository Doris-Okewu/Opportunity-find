import type { DeadlineBand, DeadlinePlan } from '../../features/intelligence/types';
import Badge from '../ui/Badge';

const BAND_TONE: Record<DeadlineBand, 'red' | 'amber' | 'indigo' | 'green' | 'default'> = {
  expired: 'red',
  critical: 'red',
  urgent: 'amber',
  focused: 'indigo',
  roadmap: 'indigo',
  phased: 'green',
  longTerm: 'green',
  rolling: 'default',
};

// Icon shape communicates urgency alongside the badge text/color — never
// color alone.
const BAND_ICON: Record<DeadlineBand, 'alert' | 'clock' | 'infinity'> = {
  expired: 'alert',
  critical: 'alert',
  urgent: 'alert',
  focused: 'clock',
  roadmap: 'clock',
  phased: 'clock',
  longTerm: 'clock',
  rolling: 'infinity',
};

function BandIcon({ band }: { band: DeadlineBand }) {
  const shape = BAND_ICON[band];
  if (shape === 'alert') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    );
  }
  if (shape === 'infinity') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" d="M18.178 8c-3.667 0-4.9 8-8.356 8-1.94 0-3-1.79-3-4s1.06-4 3-4c3.456 0 4.689 8 8.356 8 1.94 0 3-1.79 3-4s-1.06-4-3-4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" />
    </svg>
  );
}

export default function DeadlinePlanPanel({ plan }: { plan: DeadlinePlan }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            plan.band === 'expired' || plan.band === 'critical' || plan.band === 'urgent'
              ? 'bg-danger/10 text-danger'
              : plan.band === 'rolling'
                ? 'bg-surface-2 text-ink-3'
                : 'bg-journey/10 text-journey'
          }`}
        >
          <BandIcon band={plan.band} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="whitespace-normal break-normal text-base font-bold text-ink">
            {plan.daysRemaining === null
              ? 'No fixed deadline'
              : plan.isExpired
                ? 'Deadline has passed'
                : `${plan.daysRemaining} day${plan.daysRemaining === 1 ? '' : 's'} remaining`}
          </p>
          <Badge tone={BAND_TONE[plan.band]}>{plan.urgencyLabel}</Badge>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">{plan.highestPriorityAction}</p>

      {plan.realisticallyAchievable.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-ink-2">Realistically achievable</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-2">
            {plan.realisticallyAchievable.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.avoidPrioritizing.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-ink-2">Don't prioritize right now</p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-ink-2">
            {plan.avoidPrioritizing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1 text-xs font-semibold text-ink-2">Step-by-step plan</p>
        <ol className="list-inside list-decimal space-y-0.5 text-sm text-ink-2">
          {plan.stepByStepPlan.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <p className="mt-3 text-xs italic text-ink-3">This plan is a preparation guide, not a guarantee of acceptance.</p>
    </div>
  );
}
