import type { ReadinessPassport } from './readinessPassport';
import type { CompetencyFocus } from './types';

export interface JourneyStripData {
  currentStage: string;
  focusArea: string;
  nextMilestone: string;
}

/**
 * Pure formatting only — every value here is read directly from data the
 * app already computed (buildReadinessPassport / getCompetencyFramework),
 * never invented. Current stage and next milestone come straight from the
 * existing Skill Ladder result; focus area is the top-priority competency
 * category for the user's current stage (competencies are already ordered
 * by priority — see competencyFramework.ts).
 */
export function buildJourneyStripData(
  passport: ReadinessPassport,
  competencies: CompetencyFocus[] | undefined,
): JourneyStripData {
  return {
    currentStage: passport.ladder.current.stageLabel,
    focusArea: competencies?.[0]?.label ?? passport.ladder.current.stageLabel,
    nextMilestone: passport.ladder.next?.stageLabel ?? 'Deepen mastery at this stage',
  };
}
