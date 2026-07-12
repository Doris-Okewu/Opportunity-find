import type { OpportunityType } from '../../types/opportunity';
import type { PreparationFocusArea } from './types';

/**
 * Deterministic preparation checklists per opportunity type. These describe
 * generally what strong applications tend to cover — they do not claim
 * knowledge of any specific organization's actual criteria, judges, or past
 * winners.
 */
const PREPARATION_FRAMEWORKS: Record<OpportunityType, PreparationFocusArea[]> = {
  job: [
    { title: 'Role Requirements', description: 'Compare the listed requirements against your current skills and experience.' },
    { title: 'Organization Understanding', description: "Review what the organization does and how this role fits, based only on what's in the listing." },
    { title: 'CV / Portfolio Alignment', description: 'Tailor your CV or portfolio to highlight the evidence most relevant to this role.' },
    { title: 'Competency Evidence', description: 'Gather concrete examples that demonstrate the required skills, not just claims.' },
    { title: 'Interview Preparation', description: 'Prepare for likely questions based on the stated role and requirements.' },
  ],
  internship: [
    { title: 'Foundations', description: 'Confirm you have the foundational skills the listing expects.' },
    { title: 'Learning Potential', description: 'Be ready to show how quickly you pick up new tools and feedback.' },
    { title: 'Relevant Projects', description: 'Highlight any guided or personal projects related to this field.' },
    { title: 'Motivation', description: "Be clear on why this specific internship interests you." },
    { title: 'Adaptability', description: 'Show willingness to work across tasks and adjust to a real team environment.' },
  ],
  scholarship: [
    { title: 'Eligibility', description: 'Confirm you meet every stated eligibility requirement before applying.' },
    { title: 'Academic Preparation', description: 'Gather transcripts, records, or academic evidence the application requires.' },
    { title: 'Leadership', description: 'Identify examples of leadership or initiative you can reference.' },
    { title: 'Community Impact', description: 'Note any community or volunteer contributions relevant to the mission.' },
    { title: 'Essays', description: 'Draft essays that answer the actual prompts with specific, honest detail.' },
    { title: 'References', description: 'Line up references early and give them enough time to respond.' },
    { title: 'Mission Alignment', description: "Show genuine alignment with the scholarship's stated mission, using your own words." },
  ],
  fellowship: [
    { title: 'Leadership', description: 'Identify concrete examples where you led or drove an initiative.' },
    { title: 'Initiative', description: 'Highlight work you started or pushed forward without being asked.' },
    { title: 'Community Contribution', description: 'Show how you have contributed to a community, team, or cause.' },
    { title: 'Values', description: 'Be ready to articulate the values that guide your work honestly.' },
    { title: 'Long-Term Impact', description: 'Think through the impact you hope to have well beyond the fellowship itself.' },
    { title: 'Cohort Contribution', description: 'Consider what you could realistically contribute to a cohort of peers.' },
  ],
  grant: [
    { title: 'Problem Evidence', description: 'Document the evidence behind the problem your proposal addresses.' },
    { title: 'Beneficiary Need', description: 'Clearly describe who benefits and why the need is real.' },
    { title: 'Impact', description: 'Define the impact you expect, ideally with measurable indicators.' },
    { title: 'Feasibility', description: 'Be realistic about what you can deliver with the resources available.' },
    { title: 'Budget', description: 'Prepare a clear, honest budget that matches the proposed activities.' },
    { title: 'Sustainability', description: "Explain what happens after the grant period ends." },
  ],
  competition: [
    { title: 'Official Rubric', description: 'Read the official rubric or judging criteria before building anything further.' },
    { title: 'Problem Clarity', description: 'Make sure the problem you are solving is clearly defined and understood.' },
    { title: 'Innovation', description: 'Identify what is genuinely different about your approach.' },
    { title: 'Technical Execution', description: 'Make sure the core functionality works reliably before polishing extras.' },
    { title: 'User Value', description: 'Be ready to explain who benefits from this and how.' },
    { title: 'Demo', description: 'Prepare a demo that reliably shows the core value in a short time.' },
    { title: 'Presentation', description: 'Practice explaining the problem, solution, and impact concisely.' },
  ],
  tech_program: [
    { title: 'Eligibility', description: 'Confirm you meet the stated eligibility requirements for the program.' },
    { title: 'Learning Goals', description: 'Be clear on what you want to learn and why this program specifically.' },
    { title: 'Commitment', description: 'Be honest with yourself about the time commitment required and available.' },
    { title: 'Career Direction', description: 'Connect the program to your stated career path and next steps.' },
    { title: 'Ability to Apply the Learning', description: 'Think of a concrete way you plan to apply what you learn afterward.' },
  ],
  nysc: [
    { title: 'Discipline or Role Alignment', description: 'Check how the posting or scheme aligns with your discipline and interests.' },
    { title: 'Transferable Skills', description: 'Identify skills from your studies or experience that transfer to this placement.' },
    { title: 'Location', description: 'Consider the practical realities of the location for your service year.' },
    { title: 'Service Contribution', description: 'Think through the contribution you can realistically make during service.' },
    { title: 'Workplace Readiness', description: 'Prepare basic workplace habits: punctuality, communication, and professionalism.' },
  ],
};

export function getPreparationFramework(type: OpportunityType): PreparationFocusArea[] {
  return PREPARATION_FRAMEWORKS[type];
}
