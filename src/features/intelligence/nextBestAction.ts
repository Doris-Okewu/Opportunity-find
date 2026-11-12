import type { OpportunityType } from '../../types/opportunity';
import type { DeadlinePlan, MatchScoreResult } from './types';

/**
 * One deterministic "next best action" — a rule-based decision, not an AI
 * call. Priority: expired > not a personal match > time pressure >
 * unresolved match gaps > a type-appropriate default action.
 */
export function getNextBestAction(
  type: OpportunityType,
  deadlinePlan: DeadlinePlan,
  match: MatchScoreResult,
): string {
  if (deadlinePlan.isExpired) {
    return 'This opportunity has closed. Explore similar active opportunities instead.';
  }

  // Outside the user's profile: point them to their real matches before any
  // deadline urgency, so an unrelated listing is never presented as urgent.
  if (match.notPersonalMatch) {
    const reason = match.thingsToCheck[0] ?? 'This listing does not fit your selected profile.';
    return `${reason} Your preparation time is better spent on opportunities that fit your profile, so start with My Matches. You can still read this listing if it interests you.`;
  }

  if (deadlinePlan.band === 'critical') {
    return 'Today, confirm you meet the eligibility requirements and collect your documents. Everything else can wait.';
  }

  if (deadlinePlan.band === 'urgent') {
    return 'This week, update your existing materials for this listing and plan to submit a day or two early.';
  }

  if (match.thingsToCheck.length > 0) {
    return `${match.thingsToCheck[0]} Sort this out before you spend more time preparing.`;
  }

  switch (type) {
    case 'competition':
      return 'Review the official rubric or judging criteria before adding more features or work.';
    case 'grant':
    case 'fellowship':
    case 'scholarship':
      return 'Write a first draft of your impact story and back it up with specific results.';
    case 'nysc':
      return 'Confirm how your skills align with the posting and prepare your supporting documents.';
    case 'job':
    case 'internship':
    case 'tech_program':
    default:
      return 'Improve the one project that best fits this listing, then shape your application around it.';
  }
}
