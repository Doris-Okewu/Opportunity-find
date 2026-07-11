import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Opportunity } from '../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../types/opportunity';
import { getOpportunityById } from '../lib/queries/opportunities';
import { formatDeadline, isExpired } from '../utils/date';
import { getCareerPath } from '../features/careerEngine/careerPaths';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DeadlineBadge from '../components/opportunities/DeadlineBadge';
import ErrorState from '../components/opportunities/ErrorState';
import EmptyState from '../components/opportunities/EmptyState';

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setOpportunity(undefined);
      setError(null);
      try {
        const data = await getOpportunityById(id!);
        if (!cancelled) setOpportunity(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load this opportunity.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={() => setReloadToken((t) => t + 1)} />
      </div>
    );
  }

  if (opportunity === undefined) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-4 h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mb-6 h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (opportunity === null || !opportunity.is_published) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <EmptyState
          title="Opportunity not found"
          description="This listing may have been removed or the link is incorrect."
          action={
            <Link to="/opportunities">
              <Button variant="secondary">Back to Browse</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const careerPathLabels = opportunity.career_tags
    .map((tag) => getCareerPath(tag)?.label)
    .filter((label): label is string => Boolean(label));

  const expired = isExpired(opportunity.deadline);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/opportunities" className="mb-6 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400">
        &larr; Back to Browse
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        <DeadlineBadge deadline={opportunity.deadline} />
        {expired && <Badge tone="red">Closed</Badge>}
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{opportunity.title}</h1>
      <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">{opportunity.organization}</p>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
        <span>{EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}</span>
        <span>{opportunity.remote ? 'Remote' : opportunity.location || 'On-site'}</span>
        <span>Deadline: {formatDeadline(opportunity.deadline)}</span>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">About this opportunity</h2>
        <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{opportunity.description}</p>
      </div>

      {opportunity.required_skills.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {opportunity.required_skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {careerPathLabels.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Career Paths</h2>
          <div className="flex flex-wrap gap-2">
            {careerPathLabels.map((label) => (
              <Badge key={label} tone="indigo">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
        {expired ? (
          <Button variant="secondary" disabled>
            Applications closed
          </Button>
        ) : (
          <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer">
            <Button>
              Apply on official site
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </a>
        )}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          You'll be redirected to the official application page.
        </p>
      </div>
    </div>
  );
}
