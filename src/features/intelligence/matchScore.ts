import { OPPORTUNITY_TYPE_LABELS, type Opportunity } from '../../types/opportunity';
import { experienceGap, getEligibility, relevantSkills } from '../careerEngine/careerMatch';
import type { OnboardingProfile } from '../careerEngine/types';
import type { MatchDimension, MatchScoreResult, MatchStrength } from './types';

const DISCLAIMER =
  'Estimated Match reflects how closely this opportunity lines up with the profile you provided. It does not predict acceptance or guarantee any outcome.';

function strengthFromPercentage(percentage: number): MatchStrength {
  if (percentage >= 80) return 'Strong Match';
  if (percentage >= 60) return 'Good Match';
  if (percentage >= 40) return 'Possible Match';
  return 'Explore';
}

/**
 * Deterministic 0-100 estimated match score. Adapts the same signals the
 * recommendation ranking already uses (career path, experience level,
 * opportunity type, work mode, location) into an explainable, absolute
 * percentage rather than a relative sort key. Never randomized.
 *
 * Dimensions the data genuinely can't speak to (e.g. no preferred location
 * was provided) are excluded from both the earned points and the maximum
 * points, so the percentage is rebalanced across only what was actually
 * assessed instead of silently scoring a gap as zero.
 */
export function calculateMatchScore(profile: OnboardingProfile, opportunity: Opportunity): MatchScoreResult {
  const matchReasons: string[] = [];
  const thingsToCheck: string[] = [];
  const dimensions: MatchDimension[] = [];

  // Career path is a hard gate, checked before anything is scored: an
  // opportunity outside the user's path (or a closely related one), or one
  // that clearly requires far more experience, gets NO percentage at all —
  // matching secondary preferences must never produce a misleading score.
  const eligibility = getEligibility(profile, opportunity);
  if (!eligibility.eligible) {
    return {
      percentage: null,
      strengthLabel: 'Explore',
      notPersonalMatch: true,
      dimensions: [],
      matchReasons: [],
      thingsToCheck: [eligibility.exclusionReason ?? 'Not a match for your profile.'],
      unassessedNote: 'Not a personalised match, so no match score is shown. You can still explore it.',
      disclaimer: DISCLAIMER,
    };
  }

  // Career-path alignment — 35 points (direct) or 20 (closely related field).
  if (eligibility.careerFit.kind === 'direct') {
    dimensions.push({ key: 'careerPath', label: 'Career path alignment', maxPoints: 35, earnedPoints: 35 });
  } else {
    dimensions.push({ key: 'careerPath', label: 'Career path alignment', maxPoints: 35, earnedPoints: 20 });
    thingsToCheck.push('Listed for a related field rather than your exact path — check the requirements carefully.');
  }
  if (eligibility.careerReason) matchReasons.push(eligibility.careerReason);

  const skills = relevantSkills(profile.careerPath, opportunity);
  if (skills.length > 0) matchReasons.push(`Asks for skills in your path: ${skills.slice(0, 3).join(', ')}.`);

  // Experience-level compatibility — 25 points. One level above the user is
  // a stretch (partial credit); two or more above is excluded by the gate.
  const gap = experienceGap(profile.experienceLevel, opportunity.experience_level);
  if (gap === 0) {
    dimensions.push({ key: 'experienceLevel', label: 'Experience-level compatibility', maxPoints: 25, earnedPoints: 25 });
    matchReasons.push('Suitable for your selected experience level.');
  } else if (gap === 1) {
    dimensions.push({ key: 'experienceLevel', label: 'Experience-level compatibility', maxPoints: 25, earnedPoints: 12 });
    thingsToCheck.push('This listing targets one level above your selected experience — a stretch, so check the requirements.');
  } else if (gap === -1) {
    dimensions.push({ key: 'experienceLevel', label: 'Experience-level compatibility', maxPoints: 25, earnedPoints: 15 });
    thingsToCheck.push('This listing targets a level below your selected experience — it may be less of a step forward.');
  } else {
    dimensions.push({ key: 'experienceLevel', label: 'Experience-level compatibility', maxPoints: 25, earnedPoints: 0 });
    thingsToCheck.push('This listing targets a much less experienced level than the one you selected.');
  }

  // Selected opportunity-type alignment — 20 points.
  if (profile.preferredTypes.includes(opportunity.type)) {
    dimensions.push({ key: 'opportunityType', label: 'Opportunity-type alignment', maxPoints: 20, earnedPoints: 20 });
    matchReasons.push(`${OPPORTUNITY_TYPE_LABELS[opportunity.type]} is one of your preferred opportunity types.`);
  } else {
    dimensions.push({ key: 'opportunityType', label: 'Opportunity-type alignment', maxPoints: 20, earnedPoints: 0 });
    thingsToCheck.push("This isn't one of the opportunity types you selected — confirm it's still something you want.");
  }

  // Remote / on-site preference — 10 points.
  if (profile.remotePreference === 'any') {
    dimensions.push({ key: 'workMode', label: 'Work-mode preference', maxPoints: 10, earnedPoints: 10 });
    matchReasons.push('Matches your work-mode preference (open to remote or on-site).');
  } else if (profile.remotePreference === 'remote' && opportunity.remote) {
    dimensions.push({ key: 'workMode', label: 'Work-mode preference', maxPoints: 10, earnedPoints: 10 });
    matchReasons.push('Matches your remote preference.');
  } else if (profile.remotePreference === 'onsite' && !opportunity.remote) {
    dimensions.push({ key: 'workMode', label: 'Work-mode preference', maxPoints: 10, earnedPoints: 10 });
    matchReasons.push('Matches your on-site preference.');
  } else {
    dimensions.push({ key: 'workMode', label: 'Work-mode preference', maxPoints: 10, earnedPoints: 0 });
    thingsToCheck.push(`This opportunity is ${opportunity.remote ? 'remote' : 'on-site'}, which differs from your stated preference.`);
  }

  // Preferred-location alignment — 10 points. Excluded entirely when there
  // isn't enough information on either side to judge it honestly.
  const profileLocation = profile.location.trim().toLowerCase();
  if (!profileLocation || !opportunity.location) {
    dimensions.push({ key: 'location', label: 'Location alignment', maxPoints: 10, earnedPoints: null });
  } else if (opportunity.location.toLowerCase().includes(profileLocation)) {
    dimensions.push({ key: 'location', label: 'Location alignment', maxPoints: 10, earnedPoints: 10 });
    matchReasons.push('Location aligns with your preference.');
  } else {
    dimensions.push({ key: 'location', label: 'Location alignment', maxPoints: 10, earnedPoints: 0 });
    thingsToCheck.push('The listed location differs from your preference — check if remote work or relocation is possible.');
  }

  const assessedDimensions = dimensions.filter((d) => d.earnedPoints !== null);
  const maxAssessable = assessedDimensions.reduce((sum, d) => sum + d.maxPoints, 0);
  const earned = assessedDimensions.reduce((sum, d) => sum + (d.earnedPoints ?? 0), 0);

  const unassessedDimensions = dimensions.filter((d) => d.earnedPoints === null);
  const unassessedNote =
    unassessedDimensions.length > 0
      ? `${unassessedDimensions.map((d) => d.label).join(' and ')} could not be assessed from the available information, so the estimate is based on the remaining ${maxAssessable} of 100 points.`
      : null;

  if (maxAssessable === 0) {
    return {
      percentage: null,
      strengthLabel: 'Explore',
      dimensions,
      matchReasons,
      thingsToCheck: ['Not enough information to assess this opportunity against your profile yet.'],
      unassessedNote: 'None of the match dimensions could be assessed from the available information.',
      disclaimer: DISCLAIMER,
    };
  }

  const percentage = Math.round((earned / maxAssessable) * 100);

  return {
    percentage,
    strengthLabel: strengthFromPercentage(percentage),
    dimensions,
    matchReasons,
    thingsToCheck,
    unassessedNote,
    disclaimer: DISCLAIMER,
  };
}
