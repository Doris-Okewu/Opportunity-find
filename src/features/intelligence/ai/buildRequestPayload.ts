import type { Opportunity } from '../../../types/opportunity';
import type { OnboardingProfile } from '../../careerEngine/types';
import type { OpportunityIntelligence } from '../types';
import { getAIClientId } from './clientId';
import type { AIInsightRequestPayload } from './types';

/**
 * Assembles only the minimum fields the Edge Function needs, reusing the
 * deterministic intelligence already computed for the page (match score,
 * deadline plan, next best action) instead of recomputing anything.
 * Deliberately excludes anything not in this list: no Supabase keys/tokens,
 * no admin/session data, no full localStorage dump, no device/IP info.
 */
export function buildAIInsightRequestPayload(
  profile: OnboardingProfile,
  opportunity: Opportunity,
  intelligence: OpportunityIntelligence,
): AIInsightRequestPayload {
  return {
    clientRequestId: getAIClientId(),
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      organization: opportunity.organization,
      type: opportunity.type,
      careerTags: opportunity.career_tags,
      requiredSkills: opportunity.required_skills,
      experienceLevel: opportunity.experience_level,
      location: opportunity.location,
      remote: opportunity.remote,
      description: opportunity.description,
      deadline: opportunity.deadline,
    },
    profile: {
      status: profile.status,
      careerPath: profile.careerPath,
      experienceLevel: profile.experienceLevel,
      preferredTypes: profile.preferredTypes,
      remotePreference: profile.remotePreference,
      location: profile.location.trim() || null,
    },
    deterministic: {
      matchPercentage: intelligence.match.percentage,
      matchStrength: intelligence.match.strengthLabel,
      matchReasons: intelligence.match.matchReasons,
      thingsToCheck: intelligence.match.thingsToCheck,
      deadlineBand: intelligence.deadlinePlan.band,
      daysRemaining: intelligence.deadlinePlan.daysRemaining,
      isExpired: intelligence.deadlinePlan.isExpired,
      nextBestAction: intelligence.nextBestAction,
    },
  };
}
