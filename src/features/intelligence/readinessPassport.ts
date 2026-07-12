import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import { getCareerPath } from '../careerEngine/careerPaths';
import { APPLICANT_STATUS_LABELS } from '../careerEngine/types';
import type { OnboardingProfile } from '../careerEngine/types';
import { getSkillLadder } from './skillLadder';
import type { SkillLadderResult } from './types';

export interface ReadinessPassport {
  careerPathLabel: string;
  experienceLevelLabel: string;
  userTypeLabel: string;
  preferredTypeLabels: string[];
  workModeLabel: string;
  preferredLocation: string | null;
  ladder: SkillLadderResult;
  developmentFocus: string;
  nextMilestone: string;
  disclaimer: string;
}

const WORK_MODE_LABELS: Record<OnboardingProfile['remotePreference'], string> = {
  remote: 'Remote only',
  onsite: 'On-site only',
  any: 'Open to remote or on-site',
};

/**
 * Built entirely from what the user selected during onboarding — no
 * invented skills, projects, or achievements. The "stage" is a descriptive
 * label based on the self-reported experience level, not a measured score.
 */
export function buildReadinessPassport(profile: OnboardingProfile): ReadinessPassport | undefined {
  const careerPath = getCareerPath(profile.careerPath);
  const ladder = getSkillLadder(profile.careerPath, profile.experienceLevel);
  if (!careerPath || !ladder) return undefined;

  return {
    careerPathLabel: careerPath.label,
    experienceLevelLabel: EXPERIENCE_LEVEL_LABELS[profile.experienceLevel],
    userTypeLabel: APPLICANT_STATUS_LABELS[profile.status],
    preferredTypeLabels: profile.preferredTypes.map((type) => OPPORTUNITY_TYPE_LABELS[type]),
    workModeLabel: WORK_MODE_LABELS[profile.remotePreference],
    preferredLocation: profile.location.trim() || null,
    ladder,
    developmentFocus: ladder.current.focus,
    nextMilestone: ladder.next
      ? `Next stage: ${ladder.next.stageLabel} — ${ladder.next.focus}`
      : "You've selected the top of the ladder for this path — the focus now is depth, mentoring, and strategic ownership rather than a next stage.",
    disclaimer:
      'This passport reflects only what you told us during onboarding — it is not a verified skills assessment.',
  };
}
