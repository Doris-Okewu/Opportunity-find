import { Link } from 'react-router-dom';
import type { Opportunity } from '../../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import Badge from '../ui/Badge';
import DeadlineBadge from './DeadlineBadge';

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-5 transition hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-700"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="indigo">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        <DeadlineBadge deadline={opportunity.deadline} />
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{opportunity.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{opportunity.organization}</p>
      </div>

      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{opportunity.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span>{EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}</span>
        <span aria-hidden>&middot;</span>
        <span>{opportunity.remote ? 'Remote' : opportunity.location || 'On-site'}</span>
      </div>
    </Link>
  );
}
