import type { ExperienceLevel } from '../../types/opportunity';
import { getPersonalizedCareerContent } from '../careerEngine/personalize';
import type { CareerPathSlug } from '../careerEngine/types';
import type { LadderStageKey, SkillLadderResult, SkillLadderStep } from './types';

const LEVEL_ORDER: ExperienceLevel[] = ['student', 'entry', 'intermediate', 'senior'];

const STAGE_LABELS: Record<ExperienceLevel, { key: LadderStageKey; label: string }> = {
  student: { key: 'foundations', label: 'Foundations' },
  entry: { key: 'jobReady', label: 'Job-Ready' },
  intermediate: { key: 'productionReady', label: 'Production-Ready' },
  senior: { key: 'strategic', label: 'Strategic / Leadership' },
};

function buildStep(slug: CareerPathSlug, level: ExperienceLevel): SkillLadderStep | undefined {
  const content = getPersonalizedCareerContent(slug, level);
  if (!content) return undefined;

  const stage = STAGE_LABELS[level];
  return {
    stageKey: stage.key,
    stageLabel: stage.label,
    level,
    focus: content.levelExplanation,
    keySkills: content.skills.slice(0, 4),
  };
}

/**
 * Reuses the level-aware career content already built for recommendations
 * (see careerEngine/levelContent.ts) instead of maintaining a second copy of
 * skills per stage. Returns undefined only if the career path slug itself
 * isn't recognized.
 */
export function getSkillLadder(slug: CareerPathSlug, level: ExperienceLevel): SkillLadderResult | undefined {
  const current = buildStep(slug, level);
  if (!current) return undefined;

  const nextIndex = LEVEL_ORDER.indexOf(level) + 1;
  const next = nextIndex < LEVEL_ORDER.length ? (buildStep(slug, LEVEL_ORDER[nextIndex]) ?? null) : null;

  return {
    current,
    next,
    disclaimer:
      'Based on the level you selected, this is the development stage currently being used for your recommendations — not a verified assessment of your ability.',
  };
}
