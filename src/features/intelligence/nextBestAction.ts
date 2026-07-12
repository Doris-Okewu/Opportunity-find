import type { OpportunityType } from '../../types/opportunity';
import type { DeadlinePlan, MatchScoreResult } from './types';

/**
 * One deterministic "next best action" — a rule-based decision, not an AI
 * call. Priority: expired > time pressure > unresolved match gaps > a
 * type-appropriate default action.
 */
export function getNextBestAction(
  type: OpportunityType,
  deadlinePlan: DeadlinePlan,
  match: MatchScoreResult,
): string {
  if (deadlinePlan.isExpired) {
    return 'This opportunity has closed — explore similar active opportunities instead.';
  }

  if (deadlinePlan.band === 'critical') {
    return 'Verify the eligibility requirements and gather your required documents today.';
  }

  if (deadlinePlan.band === 'urgent') {
    return 'Tailor your existing materials to this opportunity and aim to submit a day or two early.';
  }

  if (match.thingsToCheck.length > 0) {
    return `${match.thingsToCheck[0]} Do this before investing more preparation time.`;
  }

  switch (type) {
    case 'competition':
      return 'Review the official rubric or judging criteria before adding more features or work.';
    case 'grant':
    case 'fellowship':
    case 'scholarship':
      return 'Draft your impact story and gather measurable evidence to support it.';
    case 'nysc':
      return 'Confirm how your skills align with the posting and prepare your supporting documents.';
    case 'job':
    case 'internship':
    case 'tech_program':
    default:
      return 'Strengthen one relevant project or piece of evidence before tailoring your application.';
  }
}
