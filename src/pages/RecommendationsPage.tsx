import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { useOpportunities } from '../hooks/useOpportunities';
import { recommend } from '../features/careerEngine/recommend';
import SkillList from '../components/recommendations/SkillList';
import ResourceList from '../components/recommendations/ResourceList';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import SkeletonCard from '../components/opportunities/SkeletonCard';
import EmptyState from '../components/opportunities/EmptyState';
import ErrorState from '../components/opportunities/ErrorState';
import Button from '../components/ui/Button';

export default function RecommendationsPage() {
  const { profile } = useOnboardingProfile();
  const { opportunities, loading, error, refetch } = useOpportunities();

  const result = useMemo(() => {
    if (!profile) return null;
    return recommend(profile, opportunities);
  }, [profile, opportunities]);

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <EmptyState
          title="Let's find your path first"
          description="Complete the quick onboarding to get personalized skill and opportunity recommendations."
          action={
            <Link to="/onboarding">
              <Button>Start Onboarding</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Recommendations</h1>
          {result?.careerPath && (
            <p className="mt-1 text-slate-600 dark:text-slate-400">{result.careerPath.description}</p>
          )}
        </div>
        <Link to="/onboarding">
          <Button variant="secondary">Retake Onboarding</Button>
        </Link>
      </div>

      {result?.careerPath && (
        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
              Skills to learn for {result.careerPath.label}
            </h2>
            <SkillList skills={result.careerPath.skills} />
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Recommended learning resources</h2>
            <ResourceList resources={result.careerPath.resources} />
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Opportunities matched to you</h2>

        {error && <ErrorState message={error} onRetry={refetch} />}

        {!error && loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!error && !loading && (result?.matchedOpportunities.length ?? 0) === 0 && (
          <EmptyState
            title="No close matches yet"
            description="Browse all opportunities to see everything currently available."
            action={
              <Link to="/opportunities">
                <Button variant="secondary">Browse All Opportunities</Button>
              </Link>
            }
          />
        )}

        {!error && !loading && (result?.matchedOpportunities.length ?? 0) > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result!.matchedOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
