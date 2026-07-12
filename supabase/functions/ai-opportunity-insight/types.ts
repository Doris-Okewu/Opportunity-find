// Self-contained types for this Edge Function. Deliberately not imported
// from the frontend's src/ tree — Deno and Vite/Node resolve modules
// differently, and this function must stay deployable on its own. Keep
// these in sync with src/features/intelligence/ai/types.ts by hand.

export type OpportunityType =
  | 'job'
  | 'internship'
  | 'scholarship'
  | 'nysc'
  | 'fellowship'
  | 'grant'
  | 'competition'
  | 'tech_program';

export type ExperienceLevel = 'student' | 'entry' | 'intermediate' | 'senior';

export type ApplicantStatus = 'student' | 'nysc' | 'graduate' | 'career_switcher' | 'tech_learner';

export type RemotePreference = 'remote' | 'onsite' | 'any';

export type DeadlineBand =
  | 'expired'
  | 'critical'
  | 'urgent'
  | 'focused'
  | 'roadmap'
  | 'phased'
  | 'longTerm'
  | 'rolling';

export type MatchStrength = 'Strong Match' | 'Good Match' | 'Possible Match' | 'Explore';

/** What the client sends. All fields here are treated as untrusted input. */
export interface AIInsightRequestBody {
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
    careerPath: string;
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

export interface AIInsightSuccessResponse {
  available: true;
  insight: AIOpportunityInsight;
}

export interface AIInsightFailureResponse {
  available: false;
  reason:
    | 'invalid_request'
    | 'rate_limited'
    | 'provider_unavailable'
    | 'invalid_model_output'
    | 'circuit_breaker';
  message: string;
}

export type AIInsightResponseBody = AIInsightSuccessResponse | AIInsightFailureResponse;
