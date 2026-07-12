import type { ExperienceLevel, OpportunityType } from '../../types/opportunity';

export type MatchStrength = 'Strong Match' | 'Good Match' | 'Possible Match' | 'Explore';

export interface MatchDimension {
  key: 'careerPath' | 'experienceLevel' | 'opportunityType' | 'workMode' | 'location';
  label: string;
  maxPoints: number;
  /** null means this dimension could not be assessed (not that it scored zero). */
  earnedPoints: number | null;
}

export interface MatchScoreResult {
  /** 0-100, or null if not enough information existed to assess any dimension. */
  percentage: number | null;
  strengthLabel: MatchStrength;
  dimensions: MatchDimension[];
  matchReasons: string[];
  thingsToCheck: string[];
  /** Present when one or more dimensions were excluded from scoring. */
  unassessedNote: string | null;
  disclaimer: string;
}

export type LadderStageKey = 'foundations' | 'jobReady' | 'productionReady' | 'strategic';

export interface SkillLadderStep {
  stageKey: LadderStageKey;
  stageLabel: string;
  level: ExperienceLevel;
  focus: string;
  keySkills: string[];
}

export interface SkillLadderResult {
  current: SkillLadderStep;
  next: SkillLadderStep | null;
  disclaimer: string;
}

export type CompetencyKey =
  | 'technical'
  | 'communication'
  | 'collaboration'
  | 'problemSolving'
  | 'leadership'
  | 'domain'
  | 'portfolio'
  | 'professional';

export interface CompetencyFocus {
  key: CompetencyKey;
  label: string;
  focus: string;
}

export interface PreparationFocusArea {
  title: string;
  description: string;
}

export type DeadlineBand =
  | 'expired'
  | 'critical'
  | 'urgent'
  | 'focused'
  | 'roadmap'
  | 'phased'
  | 'longTerm'
  | 'rolling';

export interface DeadlinePlan {
  daysRemaining: number | null;
  isExpired: boolean;
  band: DeadlineBand;
  urgencyLabel: string;
  highestPriorityAction: string;
  realisticallyAchievable: string[];
  avoidPrioritizing: string[];
  stepByStepPlan: string[];
}

export interface OpportunityIntelligence {
  match: MatchScoreResult;
  preparation: PreparationFocusArea[];
  deadlinePlan: DeadlinePlan;
  nextBestAction: string;
}

export type { ExperienceLevel, OpportunityType };
