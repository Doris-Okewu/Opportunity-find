import type { ExperienceLevel, OpportunityType } from '../../types/opportunity';

export type CareerPathSlug =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'design'
  | 'product'
  | 'marketing'
  | 'cybersecurity'
  | 'devops';

export interface LearningResource {
  title: string;
  url: string;
  provider: string;
}

export interface CareerPath {
  slug: CareerPathSlug;
  label: string;
  description: string;
  skills: string[];
  resources: LearningResource[];
}

export type ApplicantStatus =
  | 'student'
  | 'nysc'
  | 'graduate'
  | 'career_switcher'
  | 'tech_learner';

export type RemotePreference = 'remote' | 'onsite' | 'any';

export interface OnboardingProfile {
  status: ApplicantStatus;
  careerPath: CareerPathSlug;
  experienceLevel: ExperienceLevel;
  preferredTypes: OpportunityType[];
  remotePreference: RemotePreference;
  location: string;
}

export const APPLICANT_STATUS_LABELS: Record<ApplicantStatus, string> = {
  student: 'Student',
  nysc: 'NYSC Member',
  graduate: 'Graduate',
  career_switcher: 'Career Switcher',
  tech_learner: 'Tech Learner',
};
