import type { Opportunity } from '../../types/opportunity';
import { isExpired } from '../../utils/date';
import { getCareerPath } from './careerPaths';
import type { OnboardingProfile } from './types';

const MAX_RESULTS = 12;

function scoreOpportunity(opportunity: Opportunity, profile: OnboardingProfile): number {
  let score = 0;

  if (opportunity.career_tags.includes(profile.careerPath)) score += 3;
  if (profile.preferredTypes.includes(opportunity.type)) score += 2;
  if (opportunity.experience_level === profile.experienceLevel) score += 1;

  if (profile.remotePreference === 'remote' && opportunity.remote) score += 1;
  if (profile.remotePreference === 'onsite' && !opportunity.remote) score += 1;
  if (profile.remotePreference === 'any') score += 1;

  return score;
}

export interface RecommendationResult {
  careerPath: ReturnType<typeof getCareerPath>;
  matchedOpportunities: Opportunity[];
}

export function recommend(profile: OnboardingProfile, opportunities: Opportunity[]): RecommendationResult {
  const careerPath = getCareerPath(profile.careerPath);

  const scored = opportunities
    .filter((opp) => opp.is_published && !isExpired(opp.deadline))
    .map((opp) => ({ opp, score: scoreOpportunity(opp, profile) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDeadline = a.opp.deadline ? new Date(a.opp.deadline).getTime() : Infinity;
      const bDeadline = b.opp.deadline ? new Date(b.opp.deadline).getTime() : Infinity;
      return aDeadline - bDeadline;
    });

  return {
    careerPath,
    matchedOpportunities: scored.slice(0, MAX_RESULTS).map(({ opp }) => opp),
  };
}
