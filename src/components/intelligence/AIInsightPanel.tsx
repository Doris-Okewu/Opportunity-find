import type { Opportunity } from '../../types/opportunity';
import type { OnboardingProfile } from '../../features/careerEngine/types';
import type { OpportunityIntelligence } from '../../features/intelligence/types';
import { useAIOpportunityInsight } from '../../hooks/useAIOpportunityInsight';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Accordion from '../ui/Accordion';

const INFO_AVAILABILITY_LABELS = {
  officialEligibility: 'Official eligibility criteria',
  officialSelectionCriteria: 'Official selection / judging criteria',
  organizationMission: 'Organization mission or values',
} as const;

const CONFIDENCE_TONE: Record<'low' | 'medium' | 'high', 'default' | 'indigo' | 'green'> = {
  low: 'default',
  medium: 'indigo',
  high: 'green',
};

function AlwaysShownDisclaimers() {
  return (
    <div className="space-y-1 text-xs italic text-ink-3">
      <p>AI-generated guidance may be inaccurate.</p>
      <p>Verify requirements on the official application page.</p>
      <p>This is not a prediction of acceptance or selection.</p>
    </div>
  );
}

function SparkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        strokeLinecap="round"
        d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
      />
    </svg>
  );
}

export default function AIInsightPanel({
  profile,
  opportunity,
  intelligence,
}: {
  profile: OnboardingProfile;
  opportunity: Opportunity;
  intelligence: OpportunityIntelligence;
}) {
  const { status, insight, errorMessage, generate, retry } = useAIOpportunityInsight(profile, opportunity, intelligence);

  const unavailableInfo =
    status === 'success' && insight
      ? (Object.keys(INFO_AVAILABILITY_LABELS) as Array<keyof typeof INFO_AVAILABILITY_LABELS>).filter(
          (key) => insight.informationAvailability[key] === 'not_available',
        )
      : [];

  return (
    <div className="rounded-xl border border-ai/20 bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-ai/20 bg-ai/5 px-5 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ai/15 text-ai">
          <SparkIcon className="h-4 w-4" />
        </span>
        <h3 className="min-w-0 flex-1 text-base font-semibold text-ink">AI Preparation Insight</h3>
        <Badge tone="violet">AI-assisted</Badge>
      </div>

      <div className="p-5">
        {status === 'idle' && (
          <div className="animate-reveal-fade">
            <p className="text-sm text-ink-2">
              Generates additional preparation guidance using this opportunity's information and your selected
              onboarding profile. This is optional and separate from the match score and guidance above.
            </p>
            <Button className="mt-4" onClick={generate}>
              Generate AI Preparation Insight
            </Button>
          </div>
        )}

        {status === 'loading' && (
          <div role="status" aria-live="polite" className="animate-reveal-fade flex items-center gap-2 text-sm text-ink-2">
            <Spinner className="h-4 w-4 text-ai" />
            Generating AI preparation insight...
          </div>
        )}

        {(status === 'error' || status === 'timeout') && (
          <div className="animate-reveal-fade">
            <p className="text-sm text-ink-2">
              {status === 'timeout'
                ? 'AI insight is taking longer than expected. Your match score and preparation guidance are still available above.'
                : 'AI insight is temporarily unavailable. Your match score and preparation guidance are still available above.'}
            </p>
            {errorMessage && <p className="mt-1 text-xs text-ink-3">{errorMessage}</p>}
            <Button variant="secondary" className="mt-3" onClick={retry}>
              Retry
            </Button>
          </div>
        )}

        {status === 'success' && insight && (
          <div className="animate-reveal space-y-4">
            <AlwaysShownDisclaimers />

            <div className="rounded-lg bg-surface-2 p-3">
              <p className="mb-1 text-xs font-semibold text-ink-2">What the opportunity states</p>
              <p className="text-sm text-ink-2">{insight.officialInformation.summary}</p>
              {insight.officialInformation.statedRequirements.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-ink-2">
                  {insight.officialInformation.statedRequirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Always visible, not behind an accordion — this is exactly what
                you'd otherwise assume is covered and isn't. */}
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 text-xs font-semibold text-ink-2">Information not currently available</p>
              {unavailableInfo.length > 0 ? (
                <ul className="space-y-1 text-sm text-ink-2">
                  {unavailableInfo.map((key) => (
                    <li key={key}>{INFO_AVAILABILITY_LABELS[key]} — not available in the current opportunity information.</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">All three categories above were present in the opportunity record.</p>
              )}
              <p className="mt-2 text-sm text-milestone">Verified public research was not performed for this report.</p>
            </div>

            <Accordion title="AI Interpretation" defaultOpen>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-semibold text-ink-2">Likely priorities</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                    {insight.aiInterpretation.likelyPriorities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-ink-2">How to position your application</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                    {insight.aiInterpretation.positioningSuggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-ink-2">Evidence you may want to highlight</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                    {insight.aiInterpretation.evidenceToHighlight.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-ink-2">Areas to strengthen</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                    {insight.aiInterpretation.areasToStrengthen.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs italic text-ink-3">
                    These are areas to consider strengthening, not verified deficiencies.
                  </p>
                </div>
              </div>
            </Accordion>

            {insight.preparationGuidance.focusAreas.length > 0 && (
              <Accordion title="Preparation focus">
                <ul className="space-y-3">
                  {insight.preparationGuidance.focusAreas.map((area) => (
                    <li key={area.title}>
                      <p className="text-sm font-semibold text-ink">{area.title}</p>
                      <p className="text-sm text-ink-2">{area.guidance}</p>
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}

            <Accordion title="Deadline-aware guidance" defaultOpen>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">
                {insight.preparationGuidance.deadlineAwareNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </Accordion>

            <div className="rounded-xl border border-ai/25 bg-ai/5 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ai">AI Recommended Action</p>
              <p className="text-sm font-medium text-ink">{insight.recommendedAction.action}</p>
              <p className="mt-1 text-sm text-ink-2">{insight.recommendedAction.rationale}</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-2">Confidence:</span>
                <Badge tone={CONFIDENCE_TONE[insight.confidence]}>{insight.confidence}</Badge>
              </div>
              {insight.caveats.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-ink-2">
                  {insight.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
