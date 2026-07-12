import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { useOpportunities } from '../hooks/useOpportunities';
import { recommend } from '../features/careerEngine/recommend';
import { buildReadinessPassport } from '../features/intelligence/readinessPassport';
import { getCompetencyFramework } from '../features/intelligence/competencyFramework';
import { calculateMatchScore } from '../features/intelligence/matchScore';
import { buildJourneyStripData } from '../features/intelligence/journeyStrip';
import SkillList from '../components/recommendations/SkillList';
import ResourceList from '../components/recommendations/ResourceList';
import MatchedOpportunityCard from '../components/recommendations/MatchedOpportunityCard';
import SkeletonCard from '../components/opportunities/SkeletonCard';
import EmptyState from '../components/opportunities/EmptyState';
import ErrorState from '../components/opportunities/ErrorState';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Accordion from '../components/ui/Accordion';
import JourneyStrip from '../components/intelligence/JourneyStrip';
import ReadinessPassportCard from '../components/intelligence/ReadinessPassportCard';
import SkillLadderPanel from '../components/intelligence/SkillLadderPanel';
import CompetencyList from '../components/intelligence/CompetencyList';

export default function RecommendationsPage() {
  const { profile } = useOnboardingProfile();
  const { opportunities, loading, error, refetch } = useOpportunities();

  const result = useMemo(() => {
    if (!profile) return null;
    return recommend(profile, opportunities);
  }, [profile, opportunities]);

  const passport = useMemo(() => (profile ? buildReadinessPassport(profile) : undefined), [profile]);
  const competencies = useMemo(
    () => (profile ? getCompetencyFramework(profile.careerPath, profile.experienceLevel) : undefined),
    [profile],
  );
  const journeyData = useMemo(
    () => (passport ? buildJourneyStripData(passport, competencies) : undefined),
    [passport, competencies],
  );

  const matchedWithScores = useMemo(() => {
    if (!profile || !result) return [];
    return result.matchedOpportunities.map((opportunity) => ({
      opportunity,
      match: calculateMatchScore(profile, opportunity),
    }));
  }, [profile, result]);

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Your Recommendations</h1>
          {result?.careerPath && <p className="mt-1 text-ink-2">{result.careerPath.description}</p>}
        </div>
        <Link to="/onboarding">
          <Button variant="secondary">Retake Onboarding</Button>
        </Link>
      </div>

      {journeyData && (
        <div className="mb-10">
          <JourneyStrip data={journeyData} />
        </div>
      )}

      {result?.personalized && (
        <div className="mb-10">
          <p className="mb-6 max-w-3xl text-sm text-ink-2">{result.personalized.levelExplanation}</p>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Skills to learn for {result.personalized.label}</h2>
              <SkillList skills={result.personalized.skills} />
            </div>
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Recommended learning resources</h2>
              <ResourceList resources={result.personalized.resources} />
            </div>
          </div>
        </div>
      )}

      {passport && (
        <div className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-ink">Career Readiness Passport</h2>
          <Card>
            <ReadinessPassportCard passport={passport} />
          </Card>
        </div>
      )}

      {(passport || competencies) && (
        <div className="mb-10 space-y-4">
          {passport && (
            <Accordion title="Skill Ladder" defaultOpen>
              <SkillLadderPanel ladder={passport.ladder} />
            </Accordion>
          )}
          {competencies && (
            <Accordion title="Competencies to Strengthen">
              <CompetencyList competencies={competencies} stageLabel={passport?.ladder.current.stageLabel} />
            </Accordion>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-1 text-lg font-semibold text-ink">Opportunities matched to you</h2>
        <p className="mb-4 text-sm text-ink-2">
          Ranked by career-path fit, experience level, opportunity type, and your work-mode preference.
        </p>

        {error && <ErrorState message={error} onRetry={refetch} />}

        {!error && loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!error && !loading && matchedWithScores.length === 0 && (
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

        {!error && !loading && matchedWithScores.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchedWithScores.map(({ opportunity, match }) => (
              <MatchedOpportunityCard key={opportunity.id} opportunity={opportunity} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
