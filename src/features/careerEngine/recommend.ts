import type { Opportunity } from '../../types/opportunity';
import { isExpired } from '../../utils/date';
import { calculateMatchScore } from '../intelligence/matchScore';
import type { MatchScoreResult } from '../intelligence/types';
import { getCareerPath } from './careerPaths';
import { getEligibility } from './careerMatch';
import { getPersonalizedCareerContent } from './personalize';
import type { PersonalizedCareerContent } from './personalize';
import type { OnboardingProfile } from './types';

const MAX_RESULTS = 12;

export interface MatchedOpportunity {
  opportunity: Opportunity;
  match: MatchScoreResult;
  direct: boolean;
}

export interface RecommendationResult {
  careerPath: ReturnType<typeof getCareerPath>;
  personalized: PersonalizedCareerContent | undefined;
  matches: MatchedOpportunity[];
  /** Kept for existing callers. Same order as `matches`. */
  matchedOpportunities: Opportunity[];
}

/**
 * Personalised recommendations. Career-path eligibility (direct or closely
 * related field, and not clearly above the user's experience) is checked
 * FIRST; only eligible opportunities are scored. Ranking then uses the same
 * score the user sees, so displayed percentages and order always agree.
 */
export function recommend(profile: OnboardingProfile, opportunities: Opportunity[]): RecommendationResult {
  const careerPath = getCareerPath(profile.careerPath);
  const personalized = getPersonalizedCareerContent(profile.careerPath, profile.experienceLevel);

  const matches = opportunities
    .filter((opp) => opp.is_published && !isExpired(opp.deadline))
    .map((opp) => ({ opp, eligibility: getEligibility(profile, opp) }))
    .filter(({ eligibility }) => eligibility.eligible)
    .map(({ opp, eligibility }) => ({
      opportunity: opp,
      match: calculateMatchScore(profile, opp),
      direct: eligibility.careerFit.kind === 'direct',
    }))
    .sort((a, b) => {
      const pa = a.match.percentage ?? 0;
      const pb = b.match.percentage ?? 0;
      if (pb !== pa) return pb - pa;
      if (a.direct !== b.direct) return a.direct ? -1 : 1;
      const aDeadline = a.opportunity.deadline ? new Date(a.opportunity.deadline).getTime() : Infinity;
      const bDeadline = b.opportunity.deadline ? new Date(b.opportunity.deadline).getTime() : Infinity;
      return aDeadline - bDeadline;
    })
    .slice(0, MAX_RESULTS);

  return {
    careerPath,
    personalized,
    matches,
    matchedOpportunities: matches.map((m) => m.opportunity),
  };
}
