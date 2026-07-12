import type { Opportunity } from '../../types/opportunity';
import type { OnboardingProfile } from '../careerEngine/types';
import { calculateMatchScore } from './matchScore';
import { buildDeadlinePlan } from './deadlinePlan';
import { getPreparationFramework } from './preparationFramework';
import { getNextBestAction } from './nextBestAction';
import type { OpportunityIntelligence } from './types';

/**
 * Composes the independent, reusable intelligence modules (match score,
 * deadline plan, preparation framework, next best action) for a single
 * opportunity. Each module stays independently importable/testable; this is
 * just the wiring UI components call so they don't have to.
 */
export function buildOpportunityIntelligence(
  profile: OnboardingProfile,
  opportunity: Opportunity,
): OpportunityIntelligence {
  const match = calculateMatchScore(profile, opportunity);
  const deadlinePlan = buildDeadlinePlan(opportunity.type, opportunity.deadline);
  const preparation = getPreparationFramework(opportunity.type);
  const nextBestAction = getNextBestAction(opportunity.type, deadlinePlan, match);

  return { match, preparation, deadlinePlan, nextBestAction };
}
