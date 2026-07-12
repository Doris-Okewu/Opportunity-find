import { Link } from 'react-router-dom';
import type { Opportunity } from '../../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import type { MatchScoreResult } from '../../features/intelligence/types';
import Badge from '../ui/Badge';
import DeadlineBadge from '../opportunities/DeadlineBadge';
import MatchScorePanel from '../intelligence/MatchScorePanel';

export default function MatchedOpportunityCard({
  opportunity,
  match,
}: {
  opportunity: Opportunity;
  match: MatchScoreResult;
}) {
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

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span>{EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}</span>
        <span aria-hidden>&middot;</span>
        <span>{opportunity.remote ? 'Remote' : opportunity.location || 'On-site'}</span>
      </div>

      <div className="mt-auto rounded-lg border border-border bg-surface-2 p-3">
        <MatchScorePanel match={match} compact />
      </div>
    </Link>
  );
}
