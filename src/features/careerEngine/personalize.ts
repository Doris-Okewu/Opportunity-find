import type { ExperienceLevel } from '../../types/opportunity';
import { getCareerPath } from './careerPaths';
import { getCareerLevelContent, getLevelExplanation } from './levelContent';
import type { CareerPathSlug, LearningResource } from './types';

export interface PersonalizedCareerContent {
  slug: CareerPathSlug;
  label: string;
  description: string;
  skills: string[];
  resources: LearningResource[];
  levelExplanation: string;
}

/**
 * Combines a career path with an experience level to produce level-aware
 * skills, resources, and a short explanation of what to focus on at that
 * stage. Falls back to the career path's base (student-oriented) skills and
 * resources if the specific level combination isn't found, so an unknown or
 * stale experience level never results in a crash or an empty page.
 */
export function getPersonalizedCareerContent(
  slug: CareerPathSlug,
  level: ExperienceLevel,
): PersonalizedCareerContent | undefined {
  const careerPath = getCareerPath(slug);
  if (!careerPath) return undefined;

  const levelContent = getCareerLevelContent(slug, level);

  return {
    slug: careerPath.slug,
    label: careerPath.label,
    description: careerPath.description,
    skills: levelContent?.skills ?? careerPath.skills,
    resources: levelContent?.resources ?? careerPath.resources,
    levelExplanation: getLevelExplanation(careerPath.label, level),
  };
}
