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
  critical: 'Critical: act today',
  urgent: 'Urgent: this week',
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
          highestPriorityAction: 'This opportunity has closed, so there is nothing left to submit.',
          realisticallyAchievable: [],
          avoidPrioritizing: ['Trying to apply after the deadline.'],
          stepByStepPlan: [
            'Look for similar opportunities that are still open.',
            'Keep the evidence you prepared. It will help with your next application.',
          ],
        };
      case 'critical':
        return {
          highestPriorityAction: 'With only a day or two left, submit the strongest version of what you already have.',
          realisticallyAchievable: [
            `Tailoring your current ${submission} to this listing`,
            'Submitting with a few hours to spare',
          ],
          avoidPrioritizing: ['Starting a course, certification or new project', 'Learning a new skill from scratch'],
          stepByStepPlan: [
            'Read the eligibility section once more and confirm you qualify.',
            'Collect every document the application asks for.',
            `Edit your ${submission} so the most relevant work appears first.`,
            'Submit at least a few hours before the deadline.',
          ],
        };
      case 'urgent':
        return {
          highestPriorityAction: 'You have about a week. Choose one or two improvements you can finish properly.',
          realisticallyAchievable: ['One focused revision of your materials', 'One round of feedback before you submit'],
          avoidPrioritizing: ['A new project that needs several weeks', 'Rebuilding your portfolio from scratch'],
          stepByStepPlan: [
            'Decide which one or two changes would most improve this application.',
            'Read what the organization says about itself on its own website.',
            `Update your ${submission} to reflect what this listing asks for.`,
            'Ask a peer or mentor to review it quickly.',
            'Submit a day or two early.',
          ],
        };
      case 'focused':
        return {
          highestPriorityAction: 'You have a few weeks. Put your effort into one strong piece of evidence.',
          realisticallyAchievable: ['Noticeably improving one project or example', 'A polished application written for this listing'],
          avoidPrioritizing: ['Trying to improve everything at once'],
          stepByStepPlan: [
            'Pick the project or example that best fits this listing.',
            'Improve it until it clearly shows the skills the listing asks for.',
            `Prepare your ${submission} around that example.`,
            'Get feedback, revise, and submit with time to spare.',
          ],
        };
      case 'roadmap':
        return {
          highestPriorityAction: 'You have around one to two months. Plan your preparation week by week.',
          realisticallyAchievable: ['Closing one or two important skill gaps', 'One or two new pieces of evidence'],
          avoidPrioritizing: ['Spreading your time across too many unrelated skills'],
          stepByStepPlan: [
            'Write down what you will work on each week until the deadline.',
            'Start with the skill gaps that matter most for this kind of opportunity.',
            'Build or improve one or two pieces of work that show those skills.',
            'Learn about the organization as you go.',
            `Draft your ${submission} in stages rather than all at the end.`,
          ],
        };
      case 'phased':
        return {
          highestPriorityAction: 'You have a few months. Split your preparation into monthly phases.',
          realisticallyAchievable: ['One or two stronger skills backed by real work', 'A noticeably stronger profile'],
          avoidPrioritizing: ['Leaving everything until the final weeks'],
          stepByStepPlan: [
            'Set a goal for each month between now and the deadline.',
            'Develop the skills this kind of opportunity expects at your level.',
            'Produce work that shows those skills in practice.',
            `Prepare your ${submission} in the final month.`,
            'Review everything and submit early.',
          ],
        };
      case 'longTerm':
        return {
          highestPriorityAction: 'The deadline is far away, so build your foundations before you write the application.',
          realisticallyAchievable: ['A clearly stronger skill set and portfolio by the deadline'],
          avoidPrioritizing: ['Writing application materials months before you need them'],
          stepByStepPlan: [
            'Learn the core skills this kind of opportunity expects.',
            'Practise them on real or guided projects.',
            'Turn that practice into results you can point to.',
            'Fill any gaps that remain in your profile.',
            `Draft your ${submission} closer to the deadline, then revise and submit early.`,
          ],
        };
      case 'rolling':
        return {
          highestPriorityAction: 'There is no fixed deadline, so build real evidence before you apply.',
          realisticallyAchievable: ['Steady progress on your skills and portfolio'],
          avoidPrioritizing: ['Rushing an application when there is no deadline pressure'],
          stepByStepPlan: [
            'Work on the skills and evidence this kind of opportunity needs at a pace you can keep up.',
            `Prepare your ${submission} once you have solid work to show.`,
            'Check the listing now and then in case a deadline is added.',
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
