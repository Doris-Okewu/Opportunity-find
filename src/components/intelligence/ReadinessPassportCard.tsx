import type { ReadinessPassport } from '../../features/intelligence/readinessPassport';
import Badge from '../ui/Badge';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

export default function ReadinessPassportCard({ passport }: { passport: ReadinessPassport }) {
  return (
    <div>
      {/* Stage is the headline of the passport — everything else is context around it. */}
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-surface-2 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-3">Current stage</p>
          <p className="whitespace-normal break-normal text-base font-bold text-ink">{passport.ladder.current.stageLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Career Path" value={passport.careerPathLabel} />
        <Field label="Experience Level" value={passport.experienceLevelLabel} />
        <Field label="User Type" value={passport.userTypeLabel} />
        <Field label="Work Mode" value={passport.workModeLabel} />
        <Field label="Preferred Location" value={passport.preferredLocation ?? 'Not specified'} />
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">Preferred Opportunity Types</p>
        <div className="flex flex-wrap gap-2">
          {passport.preferredTypeLabels.map((label) => (
            <Badge key={label} tone="indigo">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">Current Development Focus</p>
        <p className="mt-1 text-sm text-ink-2">{passport.developmentFocus}</p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-milestone/20 bg-milestone/5 p-3">
        <span aria-hidden className="mt-0.5 shrink-0 text-milestone">→</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-milestone">Recommended Next Milestone</p>
          <p className="mt-1 text-sm text-ink-2">{passport.nextMilestone}</p>
        </div>
      </div>

      <p className="mt-4 text-xs italic text-ink-3">{passport.disclaimer}</p>
    </div>
  );
}
