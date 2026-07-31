import type { OpportunityInput } from '../../types/opportunity';

export const BLANK_OPPORTUNITY: OpportunityInput = {
  title: '',
  organization: '',
  type: 'job',
  career_tags: [],
  required_skills: [],
  experience_level: 'entry',
  location: '',
  remote: false,
  description: '',
  application_url: '',
  deadline: null,
  is_published: true,
};
