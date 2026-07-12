import { LIMITS } from './config.ts';
import type { AIInsightRequestBody } from './types.ts';

const OPPORTUNITY_TYPES = new Set([
  'job',
  'internship',
  'scholarship',
  'nysc',
  'fellowship',
  'grant',
  'competition',
  'tech_program',
]);

const EXPERIENCE_LEVELS = new Set(['student', 'entry', 'intermediate', 'senior']);
const APPLICANT_STATUSES = new Set(['student', 'nysc', 'graduate', 'career_switcher', 'tech_learner']);
const REMOTE_PREFERENCES = new Set(['remote', 'onsite', 'any']);
const DEADLINE_BANDS = new Set([
  'expired',
  'critical',
  'urgent',
  'focused',
  'roadmap',
  'phased',
  'longTerm',
  'rolling',
]);
const MATCH_STRENGTHS = new Set(['Strong Match', 'Good Match', 'Possible Match', 'Explore']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ValidationResult =
  | { ok: true; value: AIInsightRequestBody }
  | { ok: false; error: string };

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNonEmptyString(v: unknown): v is string {
  return isString(v) && v.trim().length > 0;
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

/** Truncates and strips characters that could be used to break out of the
 * delimited "untrusted data" block we build in promptBuilder.ts. */
function sanitizeFreeText(value: string, maxLength: number): string {
  return value
    .replace(/[<>]/g, ' ') // neutralize our own XML-style delimiter tags
    .replace(/```/g, "'''") // neutralize markdown fences that could visually "escape" a code block
    .slice(0, maxLength)
    .trim();
}

function sanitizeStringArray(value: unknown, maxItems: number, maxItemLength: number): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > maxItems) return null;
  const out: string[] = [];
  for (const item of value) {
    if (!isString(item)) return null;
    out.push(sanitizeFreeText(item, maxItemLength));
  }
  return out;
}

/**
 * Validates the request is well-formed and strips/truncates free-text
 * fields. Returns an error string (safe to show the caller) rather than
 * throwing, so the handler can produce a clean 400 response.
 */
export function validateRequest(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.clientRequestId) || b.clientRequestId.length > LIMITS.uuid || !UUID_RE.test(b.clientRequestId)) {
    return { ok: false, error: 'clientRequestId must be a valid UUID.' };
  }

  const opp = b.opportunity;
  if (typeof opp !== 'object' || opp === null) {
    return { ok: false, error: 'opportunity is required.' };
  }
  const o = opp as Record<string, unknown>;

  if (!isNonEmptyString(o.id) || !UUID_RE.test(o.id)) {
    return { ok: false, error: 'opportunity.id must be a valid UUID.' };
  }
  if (!isNonEmptyString(o.title) || o.title.length > LIMITS.title) {
    return { ok: false, error: 'opportunity.title is missing or too long.' };
  }
  if (!isNonEmptyString(o.organization) || o.organization.length > LIMITS.title) {
    return { ok: false, error: 'opportunity.organization is missing or too long.' };
  }
  if (!isString(o.type) || !OPPORTUNITY_TYPES.has(o.type)) {
    return { ok: false, error: 'opportunity.type is invalid.' };
  }
  if (!isString(o.experienceLevel) || !EXPERIENCE_LEVELS.has(o.experienceLevel)) {
    return { ok: false, error: 'opportunity.experienceLevel is invalid.' };
  }
  if (!isBoolean(o.remote)) {
    return { ok: false, error: 'opportunity.remote must be a boolean.' };
  }
  if (!isNonEmptyString(o.description)) {
    return { ok: false, error: 'opportunity.description is required.' };
  }
  if (o.location !== null && !isString(o.location)) {
    return { ok: false, error: 'opportunity.location must be a string or null.' };
  }
  if (o.deadline !== null && !isString(o.deadline)) {
    return { ok: false, error: 'opportunity.deadline must be a string or null.' };
  }

  const careerTags = sanitizeStringArray(o.careerTags, LIMITS.maxArrayItems, LIMITS.arrayItemLength);
  if (careerTags === null) return { ok: false, error: 'opportunity.careerTags is invalid.' };

  const requiredSkills = sanitizeStringArray(o.requiredSkills, LIMITS.maxArrayItems, LIMITS.arrayItemLength);
  if (requiredSkills === null) return { ok: false, error: 'opportunity.requiredSkills is invalid.' };

  const profile = b.profile;
  if (typeof profile !== 'object' || profile === null) {
    return { ok: false, error: 'profile is required.' };
  }
  const p = profile as Record<string, unknown>;

  if (!isString(p.status) || !APPLICANT_STATUSES.has(p.status)) {
    return { ok: false, error: 'profile.status is invalid.' };
  }
  if (!isNonEmptyString(p.careerPath) || p.careerPath.length > 60) {
    return { ok: false, error: 'profile.careerPath is invalid.' };
  }
  if (!isString(p.experienceLevel) || !EXPERIENCE_LEVELS.has(p.experienceLevel)) {
    return { ok: false, error: 'profile.experienceLevel is invalid.' };
  }
  if (!isString(p.remotePreference) || !REMOTE_PREFERENCES.has(p.remotePreference)) {
    return { ok: false, error: 'profile.remotePreference is invalid.' };
  }
  if (p.location !== null && !isString(p.location)) {
    return { ok: false, error: 'profile.location must be a string or null.' };
  }

  const preferredTypes = sanitizeStringArray(p.preferredTypes, LIMITS.maxArrayItems, 40);
  if (preferredTypes === null || !preferredTypes.every((t) => OPPORTUNITY_TYPES.has(t))) {
    return { ok: false, error: 'profile.preferredTypes is invalid.' };
  }

  const det = b.deterministic;
  if (typeof det !== 'object' || det === null) {
    return { ok: false, error: 'deterministic is required.' };
  }
  const d = det as Record<string, unknown>;

  if (d.matchPercentage !== null && (typeof d.matchPercentage !== 'number' || d.matchPercentage < 0 || d.matchPercentage > 100)) {
    return { ok: false, error: 'deterministic.matchPercentage is invalid.' };
  }
  if (!isString(d.matchStrength) || !MATCH_STRENGTHS.has(d.matchStrength)) {
    return { ok: false, error: 'deterministic.matchStrength is invalid.' };
  }
  if (!isString(d.deadlineBand) || !DEADLINE_BANDS.has(d.deadlineBand)) {
    return { ok: false, error: 'deterministic.deadlineBand is invalid.' };
  }
  if (d.daysRemaining !== null && typeof d.daysRemaining !== 'number') {
    return { ok: false, error: 'deterministic.daysRemaining is invalid.' };
  }
  if (!isBoolean(d.isExpired)) {
    return { ok: false, error: 'deterministic.isExpired must be a boolean.' };
  }
  if (!isNonEmptyString(d.nextBestAction) || d.nextBestAction.length > LIMITS.arrayItemLength) {
    return { ok: false, error: 'deterministic.nextBestAction is invalid.' };
  }

  const matchReasons = sanitizeStringArray(d.matchReasons, LIMITS.maxArrayItems, LIMITS.arrayItemLength);
  if (matchReasons === null) return { ok: false, error: 'deterministic.matchReasons is invalid.' };

  const thingsToCheck = sanitizeStringArray(d.thingsToCheck, LIMITS.maxArrayItems, LIMITS.arrayItemLength);
  if (thingsToCheck === null) return { ok: false, error: 'deterministic.thingsToCheck is invalid.' };

  const value: AIInsightRequestBody = {
    clientRequestId: b.clientRequestId as string,
    opportunity: {
      id: o.id as string,
      title: sanitizeFreeText(o.title as string, LIMITS.title),
      organization: sanitizeFreeText(o.organization as string, LIMITS.title),
      type: o.type as AIInsightRequestBody['opportunity']['type'],
      careerTags,
      requiredSkills,
      experienceLevel: o.experienceLevel as AIInsightRequestBody['opportunity']['experienceLevel'],
      location: o.location ? sanitizeFreeText(o.location as string, LIMITS.location) : null,
      remote: o.remote as boolean,
      description: sanitizeFreeText(o.description as string, LIMITS.description),
      deadline: (o.deadline as string | null) ?? null,
    },
    profile: {
      status: p.status as AIInsightRequestBody['profile']['status'],
      careerPath: sanitizeFreeText(p.careerPath as string, 60),
      experienceLevel: p.experienceLevel as AIInsightRequestBody['profile']['experienceLevel'],
      preferredTypes: preferredTypes as AIInsightRequestBody['profile']['preferredTypes'],
      remotePreference: p.remotePreference as AIInsightRequestBody['profile']['remotePreference'],
      location: p.location ? sanitizeFreeText(p.location as string, LIMITS.location) : null,
    },
    deterministic: {
      matchPercentage: (d.matchPercentage as number | null) ?? null,
      matchStrength: d.matchStrength as AIInsightRequestBody['deterministic']['matchStrength'],
      matchReasons,
      thingsToCheck,
      deadlineBand: d.deadlineBand as AIInsightRequestBody['deterministic']['deadlineBand'],
      daysRemaining: (d.daysRemaining as number | null) ?? null,
      isExpired: d.isExpired as boolean,
      nextBestAction: sanitizeFreeText(d.nextBestAction as string, LIMITS.arrayItemLength),
    },
  };

  return { ok: true, value };
}
