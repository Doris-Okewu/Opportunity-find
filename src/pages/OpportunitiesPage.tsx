import { useEffect, useMemo, useRef, useState } from 'react';
import { useOpportunities } from '../hooks/useOpportunities';
import FilterBar from '../components/opportunities/FilterBar';
import { DEFAULT_FILTERS } from '../components/opportunities/filters';
import type { OpportunityFilters } from '../components/opportunities/filters';
import { trackSiteEvent } from '../features/tracking/trackSiteEvent';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import SkeletonCard from '../components/opportunities/SkeletonCard';
import EmptyState from '../components/opportunities/EmptyState';
import ErrorState from '../components/opportunities/ErrorState';
import Button from '../components/ui/Button';

export default function OpportunitiesPage() {
  const { opportunities, loading, error, refetch } = useOpportunities();
  const [filters, setFiltersState] = useState(DEFAULT_FILTERS);

  // Analytics: record that a filter changed (key:value codes only) and that a
  // search was made — the search text itself is never sent.
  function setFilters(next: OpportunityFilters) {
    (['type', 'careerTag', 'experienceLevel', 'remote'] as const).forEach((key) => {
      if (next[key] !== filters[key]) trackSiteEvent('filter_change', { detail: `${key}:${next[key]}` });
    });
    setFiltersState(next);
  }

  const lastTrackedSearch = useRef('');
  useEffect(() => {
    const q = filters.search.trim().toLowerCase();
    if (q.length < 2 || q === lastTrackedSearch.current) return;
    const t = window.setTimeout(() => {
      lastTrackedSearch.current = q;
      trackSiteEvent('search');
    }, 1500);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return opportunities.filter((opp) => {
      if (search) {
        const haystack = `${opp.title} ${opp.organization} ${opp.description}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.type !== 'all' && opp.type !== filters.type) return false;
      if (filters.careerTag !== 'all' && !opp.career_tags.includes(filters.careerTag)) return false;
      if (filters.experienceLevel !== 'all' && opp.experience_level !== filters.experienceLevel) return false;
      if (filters.remote === 'remote' && !opp.remote) return false;
      if (filters.remote === 'onsite' && opp.remote) return false;
      return true;
    });
  }, [opportunities, filters]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Browse Opportunities</h1>
        <p className="mt-1 text-ink-2">
          Jobs, internships, scholarships, fellowships, grants, competitions, tech programs, and NYSC placements —
          every listing verified before it goes live.
        </p>
        <p className="mt-1 text-sm text-ink-3">
          General discovery: this shows every opportunity, not just matches for your career path.
        </p>
      </div>

      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-2">
          {loading ? 'Loading listings...' : `${filtered.length} opportunit${filtered.length === 1 ? 'y' : 'ies'} found`}
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!error && loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <EmptyState
          title="No opportunities match your filters"
          description="Try broadening your search or clearing a filter."
          action={
            <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear all filters
            </Button>
          }
        />
      )}

      {!error && !loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}
