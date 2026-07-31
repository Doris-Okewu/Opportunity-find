import { useMemo, useState } from 'react';
import { useOpportunities } from '../hooks/useOpportunities';
import FilterBar from '../components/opportunities/FilterBar';
import { DEFAULT_FILTERS } from '../components/opportunities/filters';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import SkeletonCard from '../components/opportunities/SkeletonCard';
import EmptyState from '../components/opportunities/EmptyState';
import ErrorState from '../components/opportunities/ErrorState';
import Button from '../components/ui/Button';

export default function OpportunitiesPage() {
  const { opportunities, loading, error, refetch } = useOpportunities();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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
