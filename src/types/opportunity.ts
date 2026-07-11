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

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  career_tags: string[];
  required_skills: string[];
  experience_level: ExperienceLevel;
  location: string | null;
  remote: boolean;
  description: string;
  application_url: string;
  deadline: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>;

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  job: 'Job',
  internship: 'Internship',
  scholarship: 'Scholarship',
  nysc: 'NYSC',
  fellowship: 'Fellowship',
  grant: 'Grant',
  competition: 'Competition',
  tech_program: 'Tech Program',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  student: 'Student',
  entry: 'Entry Level',
  intermediate: 'Intermediate',
  senior: 'Senior',
};
