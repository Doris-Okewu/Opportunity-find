import { useCallback, useRef, useState } from 'react';
import type { Opportunity } from '../types/opportunity';
import type { OnboardingProfile } from '../features/careerEngine/types';
import type { OpportunityIntelligence } from '../features/intelligence/types';
import type { AIOpportunityInsight } from '../features/intelligence/ai/types';
import { buildAIInsightRequestPayload } from '../features/intelligence/ai/buildRequestPayload';
import { requestAIInsight } from '../features/intelligence/ai/aiInsightClient';

export type AIInsightStatus = 'idle' | 'loading' | 'success' | 'error' | 'timeout';

interface UseAIOpportunityInsightResult {
  status: AIInsightStatus;
  insight: AIOpportunityInsight | null;
  errorMessage: string | null;
  generate: () => void;
  retry: () => void;
}

/**
 * Drives the optional, user-triggered AI insight call. Never runs
 * automatically — only `generate`/`retry` invoke it. A ref (not state)
 * guards against duplicate in-flight requests, since it needs to block a
 * second click synchronously rather than waiting for a re-render.
 */
export function useAIOpportunityInsight(
  profile: OnboardingProfile | null,
  opportunity: Opportunity,
  intelligence: OpportunityIntelligence,
): UseAIOpportunityInsightResult {
  const [status, setStatus] = useState<AIInsightStatus>('idle');
  const [insight, setInsight] = useState<AIOpportunityInsight | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current || !profile) return;
    inFlight.current = true;
    setStatus('loading');
    setErrorMessage(null);

    const payload = buildAIInsightRequestPayload(profile, opportunity, intelligence);
    const outcome = await requestAIInsight(payload);

    if (outcome.kind === 'success') {
      setInsight(outcome.insight);
      setStatus('success');
    } else if (outcome.kind === 'timeout') {
      setStatus('timeout');
    } else {
      setErrorMessage(outcome.message);
      setStatus('error');
    }

    inFlight.current = false;
  }, [profile, opportunity, intelligence]);

  const generate = useCallback(() => {
    void run();
  }, [run]);

  const retry = useCallback(() => {
    void run();
  }, [run]);

  return { status, insight, errorMessage, generate, retry };
}
