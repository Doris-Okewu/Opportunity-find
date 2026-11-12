import type { Opportunity } from '../../types/opportunity';
import { EXPERIENCE_LEVEL_LABELS, EXPERIENCE_LEVEL_ORDER } from '../../types/opportunity';
import type { ExperienceLevel } from '../../types/opportunity';
import { getCareerPath } from './careerPaths';
import type { CareerPathSlug, OnboardingProfile } from './types';

// Career-path eligibility for PERSONALISED matching. Career path is checked
// first and is a hard gate: secondary preferences (type, work mode, location,
// deadline) can only rank opportunities that already pass it.
//
// An opportunity is career-eligible when its career_tags include the user's
// path (a "direct" match — multi-tagged listings are how admins mark genuine
// cross-disciplinary eligibility), or one of a small, explicit set of
// closely-related paths below (a "related" match, scored lower and labelled).

/**
 * For a user on path X, opportunities tagged with these paths are also
 * realistically open to them. Deliberately one-directional and conservative:
 * e.g. a Full-stack developer fits Frontend/Backend roles, but a Frontend
 * developer is not assumed to fit a Go backend role.
 */
const RELATED_PATHS: Partial<Record<CareerPathSlug, CareerPathSlug[]>> = {
  frontend: ['fullstack', 'software-engineering'],
  backend: ['fullstack', 'software-engineering'],
  fullstack: ['frontend', 'backend', 'software-engineering'],
  'software-engineering': ['frontend', 'backend', 'fullstack'],
  mobile: ['software-engineering'],
  golang: ['backend', 'software-engineering'],
  data: ['data-science'],
  'data-science': ['data', 'ai-ml'],
  'ai-ml': ['data-science'],
  'data-engineering': ['data', 'dba'],
  cloud: ['devops'],
  devops: ['cloud', 'sysadmin'],
  'it-support': ['sysadmin', 'networking'],
  sysadmin: ['it-support', 'devops', 'networking'],
  networking: ['sysadmin'],
  design: ['product-design'],
  'product-design': ['design'],
  dba: ['data-engineering'],
};

export type CareerFit =
  | { kind: 'direct'; tag: CareerPathSlug }
  | { kind: 'related'; tag: CareerPathSlug }
  | { kind: 'none' }
  | { kind: 'unspecified' };

export function getRelatedPaths(path: CareerPathSlug): CareerPathSlug[] {
  return RELATED_PATHS[path] ?? [];
}

export function getCareerFit(path: CareerPathSlug, careerTags: string[]): CareerFit {
  if (careerTags.length === 0) return { kind: 'unspecified' };
  if (careerTags.includes(path)) return { kind: 'direct', tag: path };
  const related = getRelatedPaths(path).find((r) => careerTags.includes(r));
  if (related) return { kind: 'related', tag: related };
  return { kind: 'none' };
}

/** Positive = the opportunity targets more experience than the user has. */
export function experienceGap(userLevel: ExperienceLevel, oppLevel: ExperienceLevel): number {
  const u = EXPERIENCE_LEVEL_ORDER.indexOf(userLevel);
  const o = EXPERIENCE_LEVEL_ORDER.indexOf(oppLevel);
  if (u < 0 || o < 0) return 0;
  return o - u;
}

/** Opportunity's required skills that overlap the user's career-path skills. */
export function relevantSkills(path: CareerPathSlug, opportunity: Opportunity): string[] {
  const pathSkills = (getCareerPath(path)?.skills ?? []).map((s) => s.toLowerCase());
  const tokens = new Set(
    pathSkills.flatMap((s) => s.split(/[^a-z0-9.+#]+/).filter((t) => t.length >= 2 && !['or', 'and', 'basics', 'the'].includes(t))),
  );
  return opportunity.required_skills.filter((skill) => {
    const lower = skill.toLowerCase();
    if (pathSkills.some((ps) => ps.includes(lower) || lower.includes(ps))) return true;
    return lower.split(/[^a-z0-9.+#]+/).some((t) => t.length >= 2 && tokens.has(t));
  });
}

export interface Eligibility {
  eligible: boolean;
  careerFit: CareerFit;
  /** Why it was excluded (only when !eligible). */
  exclusionReason?: string;
  /** Plain-language explanation of the career-path match (when eligible). */
  careerReason?: string;
}

export function careerFitReason(path: CareerPathSlug, fit: CareerFit): string | undefined {
  const pathLabel = getCareerPath(path)?.label ?? path;
  if (fit.kind === 'direct') return `Listed for ${pathLabel}, your selected career path.`;
  if (fit.kind === 'related') {
    const tagLabel = getCareerPath(fit.tag)?.label ?? fit.tag;
    return `Listed for ${tagLabel}, a field closely related to ${pathLabel}.`;
  }
  return undefined;
}

/**
 * Hard eligibility for personalised recommendations. Checked BEFORE any
 * score is calculated.
 */
export function getEligibility(profile: OnboardingProfile, opportunity: Opportunity): Eligibility {
  const careerFit = getCareerFit(profile.careerPath, opportunity.career_tags);
  const pathLabel = getCareerPath(profile.careerPath)?.label ?? profile.careerPath;

  if (careerFit.kind === 'unspecified') {
    return { eligible: false, careerFit, exclusionReason: 'This listing does not specify a career path.' };
  }
  if (careerFit.kind === 'none') {
    return { eligible: false, careerFit, exclusionReason: `This listing is not for ${pathLabel} or a closely related field.` };
  }
  // Two or more levels above the user's stated experience clearly excludes them.
  if (experienceGap(profile.experienceLevel, opportunity.experience_level) >= 2) {
    return {
      eligible: false,
      careerFit,
      exclusionReason: `This listing targets ${EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]} candidates, well above your selected ${EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]} level.`,
    };
  }
  return { eligible: true, careerFit, careerReason: careerFitReason(profile.careerPath, careerFit) };
}
