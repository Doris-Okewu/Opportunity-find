import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Opportunity } from '../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../types/opportunity';
import { getOpportunityById } from '../lib/queries/opportunities';
import { formatDeadline, isExpired } from '../utils/date';
import { getCareerPath } from '../features/careerEngine/careerPaths';
import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { buildOpportunityIntelligence } from '../features/intelligence/buildOpportunityIntelligence';
import { buildReadinessPassport } from '../features/intelligence/readinessPassport';
import { getCompetencyFramework } from '../features/intelligence/competencyFramework';
import { buildJourneyStripData } from '../features/intelligence/journeyStrip';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Accordion from '../components/ui/Accordion';
import Select from '../components/ui/Select';
import DeadlineBadge from '../components/opportunities/DeadlineBadge';
import ErrorState from '../components/opportunities/ErrorState';
import EmptyState from '../components/opportunities/EmptyState';
import JourneyStrip from '../components/intelligence/JourneyStrip';
import MatchScorePanel from '../components/intelligence/MatchScorePanel';
import NextBestActionCallout from '../components/intelligence/NextBestActionCallout';
import DeadlinePlanPanel from '../components/intelligence/DeadlinePlanPanel';
import PreparationFocusList from '../components/intelligence/PreparationFocusList';
import AIInsightPanel from '../components/intelligence/AIInsightPanel';
import ReadinessPassportCard from '../components/intelligence/ReadinessPassportCard';
import SkillLadderPanel from '../components/intelligence/SkillLadderPanel';
import CompetencyList from '../components/intelligence/CompetencyList';
import OpportunityDiscussion from '../components/community/OpportunityDiscussion';
import { trackOpportunityEvent } from '../features/tracking/trackOpportunityEvent';
import { trackSiteEvent } from '../features/tracking/trackSiteEvent';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  recordApplyOpened,
  updateApplication,
} from '../features/applications/applicationsStore';
import type { ApplicationStatus } from '../features/applications/applicationsStore';
import { useApplications } from '../hooks/useApplications';

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-xl font-bold text-ink">{children}</h2>;
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useOnboardingProfile();
  const [opportunity, setOpportunity] = useState<Opportunity | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const applications = useApplications();
  const application = id ? applications.find((a) => a.opportunityId === id) : undefined;

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

  // Anonymous view tracking — fire-and-forget, only for published listings.
  useEffect(() => {
    if (opportunity && opportunity.is_published) trackOpportunityEvent(opportunity.id, 'detail_view');
  }, [opportunity]);

  const passport = useMemo(() => (profile ? buildReadinessPassport(profile) : undefined), [profile]);
  const competencies = useMemo(
    () => (profile ? getCompetencyFramework(profile.careerPath, profile.experienceLevel) : undefined),
    [profile],
  );
  const journeyData = useMemo(
    () => (passport ? buildJourneyStripData(passport, competencies) : undefined),
    [passport, competencies],
  );

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
        <div className="mb-4 h-4 w-24 rounded bg-border" />
        <div className="mb-6 h-8 w-3/4 rounded bg-border" />
        <div className="h-40 rounded bg-border" />
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
  const intelligence = profile ? buildOpportunityIntelligence(profile, opportunity) : undefined;
  const isUrgent = intelligence
    ? ['expired', 'critical', 'urgent'].includes(intelligence.deadlinePlan.band)
    : false;

  const current = opportunity;
  function handleApplyOpened() {
    // Never preventDefault / await: the browser opens the link immediately.
    if (recordApplyOpened(current)) trackSiteEvent('tracker_add', { opportunityId: current.id });
    trackOpportunityEvent(current.id, 'apply_click');
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/opportunities" className="mb-6 inline-block text-sm font-medium text-brand">
        &larr; Back to Browse
      </Link>

      {/* Opportunity Overview */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{OPPORTUNITY_TYPE_LABELS[opportunity.type]}</Badge>
        <DeadlineBadge deadline={opportunity.deadline} />
        {expired && <Badge tone="red">Closed</Badge>}
      </div>

      <h1 className="whitespace-normal break-normal text-3xl font-bold text-ink">{opportunity.title}</h1>
      <p className="mt-1 whitespace-normal break-normal text-lg text-ink-2">{opportunity.organization}</p>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-3">
        <span>{EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}</span>
        <span>{opportunity.remote ? 'Remote' : opportunity.location || 'On-site'}</span>
        <span>Deadline: {formatDeadline(opportunity.deadline)}</span>
      </div>

      <div className="mt-8">
        <p className="whitespace-pre-line text-ink-2">{opportunity.description}</p>
      </div>

      {/* Section-level surface variation: each guidance group is its own
          bg-surface-2 panel against the canvas, with the (white) Card/
          AIInsightPanel content nested inside reading as clearly elevated. */}
      <div className="mt-8 space-y-6">
        {intelligence && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>Your Match</SectionHeading>
            <Card>
              <MatchScorePanel match={intelligence.match} listingFields={careerPathLabels} />
            </Card>
          </div>
        )}

        {journeyData && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>Your Career Journey</SectionHeading>
            <JourneyStrip data={journeyData} />
          </div>
        )}

        {passport && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>Readiness and Skills</SectionHeading>
            <div className="space-y-4">
              <Card>
                <ReadinessPassportCard passport={passport} />
              </Card>
              <Accordion title="Skill Ladder" defaultOpen>
                <SkillLadderPanel ladder={passport.ladder} />
              </Accordion>
              {competencies && (
                <Accordion title="Competencies to Strengthen">
                  <CompetencyList competencies={competencies} stageLabel={passport.ladder.current.stageLabel} />
                </Accordion>
              )}
            </div>
          </div>
        )}

        {intelligence && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>Preparation and Deadline Plan</SectionHeading>
            <div className="space-y-4">
              <NextBestActionCallout
                action={intelligence.nextBestAction}
                links={
                  intelligence.match.notPersonalMatch
                    ? [
                        { label: 'See My Matches', to: '/recommendations' },
                        { label: 'Back to Browse', to: '/opportunities', variant: 'secondary' },
                      ]
                    : []
                }
              />
              <Accordion title="Deadline-Aware Action Plan" defaultOpen>
                <DeadlinePlanPanel plan={intelligence.deadlinePlan} />
              </Accordion>
              <Accordion title="Preparation Focus">
                <PreparationFocusList areas={intelligence.preparation} urgent={isUrgent} />
              </Accordion>
            </div>
          </div>
        )}

        {intelligence && profile && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>AI Preparation Insight</SectionHeading>
            <AIInsightPanel profile={profile} opportunity={opportunity} intelligence={intelligence} />
          </div>
        )}

        {!profile && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <EmptyState
              title="Get a personalized match"
              description="Complete the quick onboarding to see your estimated match, career journey, preparation focus, and a deadline-aware action plan for this opportunity."
              action={
                <Link to="/onboarding">
                  <Button variant="secondary">Start Onboarding</Button>
                </Link>
              }
            />
          </div>
        )}

        {(opportunity.required_skills.length > 0 || careerPathLabels.length > 0) && (
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SectionHeading>Official Information and Resources</SectionHeading>

            {opportunity.required_skills.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold text-ink-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {opportunity.required_skills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {careerPathLabels.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-2">Career Paths</p>
                <div className="flex flex-wrap gap-2">
                  {careerPathLabels.map((label) => (
                    <Badge key={label} tone="indigo">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-6">
        <SectionHeading>Discussion</SectionHeading>
        <OpportunityDiscussion opportunityId={opportunity.id} />
      </div>

      {/* Apply */}
      <div className="mt-10 border-t border-border pt-6">
        {expired ? (
          <Button variant="secondary" disabled>
            Applications closed
          </Button>
        ) : (
          <a
            href={opportunity.application_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyOpened}
            onAuxClick={(e) => {
              if (e.button === 1) handleApplyOpened();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]"
          >
            Apply on official site
            <span className="sr-only">(opens in a new tab)</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        )}
        <p className="mt-2 text-xs text-ink-3">You'll be redirected to the official application page.</p>

        {application && (
          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4" aria-live="polite">
            <label htmlFor="application-status" className="block text-sm font-semibold text-ink">
              {application.status === 'opened' ? 'Did you submit your application?' : 'Your application status'}
            </label>
            <p className="mt-1 text-xs text-ink-3">
              Saved only in this browser. Update it as things progress — it's for your own tracking.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-64">
                <Select
                  id="application-status"
                  value={application.status}
                  onChange={(e) => {
                    const status = e.target.value as ApplicationStatus;
                    updateApplication(application.opportunityId, { status });
                    trackSiteEvent('tracker_status_change', { detail: status });
                  }}
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>
              {application.status === 'opened' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    updateApplication(application.opportunityId, { status: 'applied' });
                    trackSiteEvent('tracker_status_change', { detail: 'applied' });
                  }}
                >
                  Yes, I applied
                </Button>
              )}
              <Link to="/applications" className="text-sm font-medium text-brand">
                View My Applications &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
