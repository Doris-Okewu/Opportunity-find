import type { ExperienceLevel, OpportunityType } from '../../types/opportunity';

// Slugs are stored in opportunities.career_tags and in saved onboarding
// profiles, so existing ones must never be renamed — only labels may change.
export type CareerPathSlug =
  // Software development
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'software-engineering'
  | 'mobile'
  | 'golang'
  // Data and AI
  | 'data'
  | 'data-science'
  | 'ai-ml'
  | 'data-engineering'
  // Cybersecurity and infrastructure
  | 'cybersecurity'
  | 'cloud'
  | 'devops'
  | 'it-support'
  | 'sysadmin'
  | 'networking'
  // Design and product
  | 'design'
  | 'product-design'
  | 'product'
  | 'qa'
  // Other technology fields
  | 'blockchain'
  | 'dba'
  | 'technical-writing'
  | 'marketing';

export type CareerCategory = 'software' | 'data' | 'infrastructure' | 'design-product' | 'other';

export const CAREER_CATEGORY_LABELS: Record<CareerCategory, string> = {
  software: 'Software Development',
  data: 'Data and Artificial Intelligence',
  infrastructure: 'Cybersecurity and Infrastructure',
  'design-product': 'Design and Product',
  other: 'Other Technology Fields',
};

export interface LearningResource {
  title: string;
  url: string;
  provider: string;
}

export interface CareerPath {
  slug: CareerPathSlug;
  category: CareerCategory;
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
