import type { OpportunityType, ExperienceLevel } from '../../../types/opportunity';
import type { ApplicantStatus, RemotePreference, CareerPathSlug } from '../../careerEngine/types';
import type { MatchStrength, DeadlineBand } from '../types';

/**
 * Mirrors supabase/functions/ai-opportunity-insight/types.ts by hand. The
 * Edge Function keeps its own copy rather than importing from here because
 * Deno and Vite resolve modules differently — see that function's README.
 */
export interface AIInsightRequestPayload {
  clientRequestId: string;
  opportunity: {
    id: string;
    title: string;
    organization: string;
    type: OpportunityType;
    careerTags: string[];
    requiredSkills: string[];
    experienceLevel: ExperienceLevel;
    location: string | null;
    remote: boolean;
    description: string;
    deadline: string | null;
  };
  profile: {
    status: ApplicantStatus;
    careerPath: CareerPathSlug;
    experienceLevel: ExperienceLevel;
    preferredTypes: OpportunityType[];
    remotePreference: RemotePreference;
    location: string | null;
  };
  deterministic: {
    matchPercentage: number | null;
    matchStrength: MatchStrength;
    matchReasons: string[];
    thingsToCheck: string[];
    deadlineBand: DeadlineBand;
    daysRemaining: number | null;
    isExpired: boolean;
    nextBestAction: string;
  };
}

export interface AIOpportunityInsight {
  schemaVersion: 1;
  generatedAt: string;
  opportunityId: string;

  officialInformation: {
    summary: string;
    statedRequirements: string[];
    source: 'opportunity_record';
  };

  informationAvailability: {
    officialEligibility: 'available' | 'not_available';
    officialSelectionCriteria: 'available' | 'not_available';
    organizationMission: 'available' | 'not_available';
    verifiedPublicResearch: 'not_performed';
  };

  aiInterpretation: {
    likelyPriorities: string[];
    positioningSuggestions: string[];
    evidenceToHighlight: string[];
    areasToStrengthen: string[];
  };

  preparationGuidance: {
    focusAreas: Array<{ title: string; guidance: string }>;
    deadlineAwareNotes: string[];
  };

  recommendedAction: {
    action: string;
    rationale: string;
  };

  confidence: 'low' | 'medium' | 'high';
  caveats: string[];
}

export type AIInsightFailureReason =
  | 'invalid_request'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'invalid_model_output'
  | 'circuit_breaker';

export type AIInsightResponseBody =
  | { available: true; insight: AIOpportunityInsight }
  | { available: false; reason: AIInsightFailureReason; message: string };
