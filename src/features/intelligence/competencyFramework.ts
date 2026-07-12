import type { ExperienceLevel } from '../../types/opportunity';
import { getCareerPath } from '../careerEngine/careerPaths';
import type { CareerPathSlug } from '../careerEngine/types';
import type { CompetencyFocus, CompetencyKey } from './types';

const CATEGORY_LABELS: Record<CompetencyKey, string> = {
  technical: 'Role-Specific / Technical Skills',
  communication: 'Communication',
  collaboration: 'Collaboration',
  problemSolving: 'Problem-Solving',
  leadership: 'Leadership & Ownership',
  domain: 'Domain Knowledge',
  portfolio: 'Portfolio / Evidence',
  professional: 'Professional & Workplace Skills',
};

// Level-appropriate phrasing per category, reused across every career path.
// {career} is substituted with the path's label. Variation across paths
// comes from which categories a path emphasizes and in what order (below);
// variation across levels comes from these templates.
const CATEGORY_LEVEL_TEMPLATES: Record<CompetencyKey, Record<ExperienceLevel, string>> = {
  technical: {
    student: 'Build core {career} fundamentals through guided, hands-on practice.',
    entry: 'Apply {career} fundamentals to real, employer-evaluable projects.',
    intermediate: 'Own production-grade {career} work, with testing and performance in mind.',
    senior: 'Set technical direction and standards across {career} work.',
  },
  communication: {
    student: 'Practice explaining your work and decisions clearly to peers and mentors.',
    entry: 'Communicate progress, blockers, and decisions clearly within your team.',
    intermediate: 'Explain trade-offs and decisions clearly to cross-functional partners.',
    senior: 'Communicate strategy, risk, and impact clearly to executives and external stakeholders.',
  },
  collaboration: {
    student: 'Get comfortable asking for feedback and working alongside more experienced peers.',
    entry: 'Collaborate reliably with teammates across roles on shared deliverables.',
    intermediate: 'Coordinate across teams and disciplines on larger, interdependent work.',
    senior: 'Align multiple teams and stakeholders around shared goals and trade-offs.',
  },
  problemSolving: {
    student: 'Practice breaking small, guided problems into manageable steps.',
    entry: 'Independently solve well-scoped, real-world problems with occasional guidance.',
    intermediate: 'Diagnose ambiguous, larger problems and design workable solutions.',
    senior: 'Anticipate systemic problems and set the approach others will follow.',
  },
  leadership: {
    student: 'Look for small opportunities to help peers or lead a study group.',
    entry: 'Take ownership of your own tasks and follow through reliably.',
    intermediate: 'Take ownership of larger initiatives and support less experienced teammates.',
    senior: 'Mentor others, set direction, and take accountability for team- or org-level outcomes.',
  },
  domain: {
    student: 'Build a general understanding of how this field fits into real organizations.',
    entry: 'Understand the specific context and constraints of the organizations you apply to.',
    intermediate: 'Develop working expertise in the industry or domain you operate in.',
    senior: 'Bring deep domain expertise that shapes strategic decisions.',
  },
  portfolio: {
    student: 'Start collecting small guided projects, even if simple.',
    entry: 'Build one to three polished, employer-evaluable projects that demonstrate your skills.',
    intermediate: 'Maintain a portfolio of production-grade work with measurable outcomes.',
    senior: 'Curate evidence of impact, leadership, and outcomes at scale.',
  },
  professional: {
    student: 'Practice reliability: showing up, meeting deadlines, and following instructions.',
    entry: 'Build workplace habits: clear updates, meeting deadlines, and professional communication.',
    intermediate: 'Model dependable, high-trust workplace behavior for newer teammates.',
    senior: 'Set the professional and ethical standard others are expected to follow.',
  },
};

// Which categories matter most for each career path, and in what order —
// this is what varies "the exact emphasis" per path (feature 4).
const CAREER_COMPETENCY_EMPHASIS: Record<CareerPathSlug, CompetencyKey[]> = {
  frontend: ['technical', 'collaboration', 'communication', 'professional', 'portfolio', 'leadership'],
  backend: ['technical', 'problemSolving', 'domain', 'collaboration', 'professional', 'leadership'],
  data: ['technical', 'problemSolving', 'communication', 'domain', 'portfolio', 'leadership'],
  design: ['communication', 'problemSolving', 'collaboration', 'portfolio', 'domain', 'leadership'],
  product: ['communication', 'problemSolving', 'leadership', 'domain', 'portfolio', 'collaboration'],
  marketing: ['communication', 'problemSolving', 'domain', 'portfolio', 'collaboration', 'leadership'],
  cybersecurity: ['technical', 'problemSolving', 'communication', 'professional', 'domain', 'leadership'],
  devops: ['technical', 'problemSolving', 'collaboration', 'domain', 'professional', 'leadership'],
};

/**
 * Broader-than-technical competencies to strengthen for a career path and
 * level — framed as growth areas, not verified deficiencies (the app has no
 * skills assessment). Returns undefined only if the career path slug isn't
 * recognized.
 */
export function getCompetencyFramework(slug: CareerPathSlug, level: ExperienceLevel): CompetencyFocus[] | undefined {
  const careerPath = getCareerPath(slug);
  if (!careerPath) return undefined;

  return CAREER_COMPETENCY_EMPHASIS[slug].map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    focus: CATEGORY_LEVEL_TEMPLATES[key][level].replace('{career}', careerPath.label),
  }));
}
