import { Link } from 'react-router-dom';
import type { Opportunity } from '../../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import Badge from '../ui/Badge';
import DeadlineBadge from './DeadlineBadge';

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="indigo">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        <DeadlineBadge deadline={opportunity.deadline} />
      </div>

      <div className="min-w-0">
        <h3 className="whitespace-normal break-normal text-base font-semibold leading-snug text-ink">{opportunity.title}</h3>
        <p className="whitespace-normal break-normal text-sm text-ink-2">{opportunity.organization}</p>
      </div>

      <p className="line-clamp-2 text-sm text-ink-2">{opportunity.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75Z" />
          </svg>
          {EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}
        </span>
        <span className="inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {opportunity.remote ? 'Remote' : opportunity.location || 'On-site'}
        </span>
      </div>
    </Link>
  );
}
