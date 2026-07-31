import type { OpportunityType, ExperienceLevel } from '../../types/opportunity';

export interface OpportunityFilters {
  search: string;
  type: OpportunityType | 'all';
  careerTag: string | 'all';
  experienceLevel: ExperienceLevel | 'all';
  remote: 'all' | 'remote' | 'onsite';
}

export const DEFAULT_FILTERS: OpportunityFilters = {
  search: '',
  type: 'all',
  careerTag: 'all',
  experienceLevel: 'all',
  remote: 'all',
};
