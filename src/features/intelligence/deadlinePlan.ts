import type { OpportunityType } from '../../types/opportunity';
import { daysUntil, isExpired } from '../../utils/date';
import type { DeadlineBand, DeadlinePlan } from './types';

// What the "submission" actually is, in plain language, per opportunity type.
const SUBMISSION_NOUN: Record<OpportunityType, string> = {
  job: 'CV and portfolio',
  internship: 'CV and portfolio',
  scholarship: 'essay and application',
  fellowship: 'application and proposal',
  grant: 'proposal and budget',
  competition: 'submission and demo',
  tech_program: 'application',
  nysc: 'request and supporting documents',
};

function bandFromDays(daysRemaining: number | null): DeadlineBand {
  if (daysRemaining === null) return 'rolling';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 30) return 'focused';
  if (daysRemaining <= 90) return 'roadmap';
  if (daysRemaining <= 180) return 'phased';
  return 'longTerm';
}

const URGENCY_LABELS: Record<DeadlineBand, string> = {
  expired: 'Closed',
  critical: 'Critical — act today',
  urgent: 'Urgent — this week',
  focused: 'Focused preparation window',
  roadmap: 'Roadmap phase',
  phased: 'Phased preparation',
  longTerm: 'Long-term preparation',
  rolling: 'No fixed deadline',
};

/**
 * Chooses a realistic preparation depth from the time actually remaining —
 * never suggests mastering major skills in a few days, and never implies
 * finishing the plan guarantees acceptance.
 */
export function buildDeadlinePlan(type: OpportunityType, deadline: string | null): DeadlinePlan {
  const submission = SUBMISSION_NOUN[type];
  const expired = isExpired(deadline);
  const daysRemaining = deadline ? daysUntil(deadline) : null;
  const band = expired ? 'expired' : bandFromDays(daysRemaining);

  const base: Omit<DeadlinePlan, 'daysRemaining' | 'isExpired' | 'band' | 'urgencyLabel'> = (() => {
    switch (band) {
      case 'expired':
        return {
          highestPriorityAction: 'This opportunity has closed — no application plan is needed.',
          realisticallyAchievable: [],
          avoidPrioritizing: ['Do not attempt to submit to a closed opportunity.'],
          stepByStepPlan: [
            'Browse similar active opportunities instead.',
            'Reuse any evidence or preparation you already built for the next matching deadline.',
          ],
        };
      case 'critical':
        return {
          highestPriorityAction: 'Verify the eligibility requirements and gather your required documents today.',
          realisticallyAchievable: [
            'Tailoring your existing materials to this specific opportunity',
            'Submitting with a safety margin before the deadline',
          ],
          avoidPrioritizing: ['Starting a new course, certification, or large project', 'Learning a new skill from scratch'],
          stepByStepPlan: [
            'Confirm you meet every stated eligibility requirement.',
            'Gather all required documents now.',
            `Tailor your existing ${submission} to this specific opportunity.`,
            'Focus only on evidence you already have — do not start anything new.',
            'Submit with at least a few hours of buffer before the deadline.',
          ],
        };
      case 'urgent':
        return {
          highestPriorityAction: 'Prioritize the one or two highest-impact improvements you can realistically finish this week.',
          realisticallyAchievable: ['A focused revision of your existing materials', 'One round of feedback before submitting'],
          avoidPrioritizing: ['Committing to a new multi-week project', 'Rebuilding your portfolio from scratch'],
          stepByStepPlan: [
            'Identify the one or two most application-critical improvements.',
            'Research the provider using publicly available information.',
            `Tailor your ${submission} to this opportunity.`,
            'Get fast feedback from a peer or mentor.',
            'Submit a day or two early to leave a buffer.',
          ],
        };
      case 'focused':
        return {
          highestPriorityAction: 'Pick one relevant project or piece of evidence and strengthen it.',
          realisticallyAchievable: ['Meaningfully improving one project or evidence item', 'A polished, tailored application'],
          avoidPrioritizing: ['Trying to improve everything at once'],
          stepByStepPlan: [
            'Choose the single improvement most relevant to this opportunity.',
            'Strengthen that project or evidence item.',
            `Prepare your ${submission} materials.`,
            'Get feedback and revise.',
            'Submit with a buffer before the deadline.',
          ],
        };
      case 'roadmap':
        return {
          highestPriorityAction: 'Build a weekly preparation roadmap targeting this opportunity.',
          realisticallyAchievable: ['Closing one or two priority competency gaps', 'One to two new pieces of evidence'],
          avoidPrioritizing: ['Spreading effort across too many unrelated skills'],
          stepByStepPlan: [
            'Build a weekly preparation roadmap.',
            'Address the priority competency gaps for this opportunity type.',
            'Build or improve one to two pieces of relevant evidence.',
            'Research the opportunity and provider as you go.',
            `Prepare your ${submission} materials in stages.`,
          ],
        };
      case 'phased':
        return {
          highestPriorityAction: 'Create a phased, monthly roadmap that builds priority skills before the deadline.',
          realisticallyAchievable: ['Developing one or two priority skills with real evidence', 'A meaningfully stronger profile'],
          avoidPrioritizing: ['Waiting until the final weeks to start preparing'],
          stepByStepPlan: [
            'Create a phased, monthly preparation roadmap.',
            'Develop the priority skills for this stage and opportunity type.',
            'Build evidence that demonstrates those skills.',
            'Strengthen your overall profile.',
            `Prepare your ${submission} materials.`,
            'Review and submit with time to spare.',
          ],
        };
      case 'longTerm':
        return {
          highestPriorityAction: 'Start from foundations and build toward this opportunity in stages.',
          realisticallyAchievable: ['A genuinely stronger skill set and portfolio by the deadline'],
          avoidPrioritizing: ['Rushing to prepare materials months before they are needed'],
          stepByStepPlan: [
            'Foundations: build the core skills this opportunity type expects.',
            'Applied practice: use those skills on real or guided projects.',
            'Evidence and impact: turn that practice into demonstrable outcomes.',
            'Profile strengthening: fill in remaining gaps.',
            `Application preparation: draft your ${submission}.`,
            'Review and submission: revise and submit with a buffer.',
          ],
        };
      case 'rolling':
        return {
          highestPriorityAction: 'Use the open timeline to build real evidence rather than rushing an application.',
          realisticallyAchievable: ['Steady, unhurried skill and portfolio building'],
          avoidPrioritizing: ['Treating this as urgent when there is no stated deadline'],
          stepByStepPlan: [
            'Build core skills and evidence relevant to this opportunity type at a sustainable pace.',
            'Prepare your materials once you have solid evidence to show.',
            'Check back periodically in case a deadline is later added.',
          ],
        };
    }
  })();

  return {
    daysRemaining,
    isExpired: expired,
    band,
    urgencyLabel: URGENCY_LABELS[band],
    ...base,
  };
}
