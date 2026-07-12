import type { AIInsightRequestBody, AIOpportunityInsight } from './types.ts';

const CAPS = {
  statedRequirements: 10,
  interpretationList: 8,
  focusAreas: 6,
  deadlineNotes: 6,
  caveats: 6,
};

// Anything resembling a prediction of outcome is an automatic rejection of
// the whole response (not a field to strip) — this is exactly the category
// of claim the product must never surface, so we fail closed rather than
// try to salvage a response that produced it.
const FORBIDDEN_OUTCOME_PATTERNS: RegExp[] = [
  /\bchance(s)? of (being )?(accepted|selected|winning|success)\b/i,
  /\bprobability of\b/i,
  /\blikely to (be )?(accepted|selected|win)\b/i,
  /\bguaranteed? to (be )?(accepted|selected|win)\b/i,
  /\b\d{1,3}%\s*(chance|likely|probability)/i,
  /\bwill (definitely|certainly) (be accepted|win|be selected)\b/i,
  /\bpredicted (outcome|selection|winner)\b/i,
];

// Guidance that assumes more runway than a tight deadline actually allows.
// Used to filter individual list items (not reject the whole response) when
// the deterministic deadline band is critical/urgent, and to decide whether
// the recommendedAction itself needs replacing.
const LONG_RUNWAY_PATTERNS: RegExp[] = [
  /\b(enroll|sign up|register)\b.{0,40}\b(course|bootcamp|certification|program)\b/i,
  /\bfrom scratch\b/i,
  /\blearn(ing)? (a )?new (skill|language|framework|stack)\b/i,
  /\bbuild(ing)? (a )?(new|large|major) project\b/i,
  /\bmaster\b/i,
  /\bmonths? (of )?(preparation|practice|study)\b/i,
];

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/**
 * Structural + type validation of the parsed Gemini output against our own
 * schema. Deliberately hand-written (no zod/ajv in this project) — see the
 * README for why a new dependency wasn't introduced for this. Returns null
 * if the shape is wrong in any way that matters; never partially trusts a
 * malformed object.
 */
function isWellFormed(value: unknown): value is AIOpportunityInsight {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  const oi = v.officialInformation as Record<string, unknown> | undefined;
  if (typeof oi !== 'object' || oi === null) return false;
  if (typeof oi.summary !== 'string') return false;
  if (!isStringArray(oi.statedRequirements)) return false;
  if (oi.source !== 'opportunity_record') return false;

  const ia = v.informationAvailability as Record<string, unknown> | undefined;
  if (typeof ia !== 'object' || ia === null) return false;
  if (!['available', 'not_available'].includes(ia.officialEligibility as string)) return false;
  if (!['available', 'not_available'].includes(ia.officialSelectionCriteria as string)) return false;
  if (!['available', 'not_available'].includes(ia.organizationMission as string)) return false;
  if (ia.verifiedPublicResearch !== 'not_performed') return false;

  const ai = v.aiInterpretation as Record<string, unknown> | undefined;
  if (typeof ai !== 'object' || ai === null) return false;
  if (!isStringArray(ai.likelyPriorities)) return false;
  if (!isStringArray(ai.positioningSuggestions)) return false;
  if (!isStringArray(ai.evidenceToHighlight)) return false;
  if (!isStringArray(ai.areasToStrengthen)) return false;

  const pg = v.preparationGuidance as Record<string, unknown> | undefined;
  if (typeof pg !== 'object' || pg === null) return false;
  if (!Array.isArray(pg.focusAreas)) return false;
  for (const area of pg.focusAreas) {
    if (typeof area !== 'object' || area === null) return false;
    const a = area as Record<string, unknown>;
    if (typeof a.title !== 'string' || typeof a.guidance !== 'string') return false;
  }
  if (!isStringArray(pg.deadlineAwareNotes)) return false;

  const ra = v.recommendedAction as Record<string, unknown> | undefined;
  if (typeof ra !== 'object' || ra === null) return false;
  if (typeof ra.action !== 'string' || typeof ra.rationale !== 'string') return false;

  if (!['low', 'medium', 'high'].includes(v.confidence as string)) return false;
  if (!isStringArray(v.caveats)) return false;

  return true;
}

function capArray<T>(arr: T[], max: number): T[] {
  return arr.slice(0, max);
}

export interface ResponseValidationResult {
  ok: boolean;
  insight?: AIOpportunityInsight;
  failureReason?: 'parse_error' | 'schema_invalid' | 'forbidden_content';
}

export function validateAndCorrectResponse(
  rawText: string,
  request: AIInsightRequestBody,
): ResponseValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, failureReason: 'parse_error' };
  }

  if (!isWellFormed(parsed)) {
    return { ok: false, failureReason: 'schema_invalid' };
  }

  const allStrings = collectStrings(parsed);
  if (FORBIDDEN_OUTCOME_PATTERNS.some((re) => allStrings.some((s) => re.test(s)))) {
    return { ok: false, failureReason: 'forbidden_content' };
  }

  let insight = parsed as AIOpportunityInsight;

  // Cap list lengths for a scannable UI (verbosity, not a safety issue).
  insight = {
    ...insight,
    officialInformation: {
      ...insight.officialInformation,
      statedRequirements: capArray(insight.officialInformation.statedRequirements, CAPS.statedRequirements),
    },
    aiInterpretation: {
      likelyPriorities: capArray(insight.aiInterpretation.likelyPriorities, CAPS.interpretationList),
      positioningSuggestions: capArray(insight.aiInterpretation.positioningSuggestions, CAPS.interpretationList),
      evidenceToHighlight: capArray(insight.aiInterpretation.evidenceToHighlight, CAPS.interpretationList),
      areasToStrengthen: capArray(insight.aiInterpretation.areasToStrengthen, CAPS.interpretationList),
    },
    preparationGuidance: {
      focusAreas: capArray(insight.preparationGuidance.focusAreas, CAPS.focusAreas),
      deadlineAwareNotes: capArray(insight.preparationGuidance.deadlineAwareNotes, CAPS.deadlineNotes),
    },
    caveats: capArray(insight.caveats, CAPS.caveats),
  };

  insight = applyDeadlineSafety(insight, request);

  return { ok: true, insight };
}

/**
 * Deadline is treated as authoritative from the deterministic layer, not
 * from anything Gemini decided. This is a corrective net on top of the
 * prompt instructions, not a replacement for them: it removes or replaces
 * guidance that assumes more time than the deterministic band allows,
 * using the deterministic Next Best Action as the safe substitute.
 */
function applyDeadlineSafety(insight: AIOpportunityInsight, request: AIInsightRequestBody): AIOpportunityInsight {
  const { deadlineBand, nextBestAction, isExpired } = request.deterministic;

  if (isExpired || deadlineBand === 'expired') {
    return {
      ...insight,
      preparationGuidance: {
        focusAreas: [],
        deadlineAwareNotes: ['This opportunity has closed. No application plan is provided — explore similar active opportunities instead.'],
      },
      recommendedAction: {
        action: nextBestAction,
        rationale: 'This opportunity has passed its deadline, so preparation effort is better spent on active opportunities.',
      },
    };
  }

  if (deadlineBand === 'critical' || deadlineBand === 'urgent') {
    const isUnsafe = (s: string) => LONG_RUNWAY_PATTERNS.some((re) => re.test(s));

    const filterList = (list: string[]) => list.filter((s) => !isUnsafe(s));

    const safeFocusAreas = insight.preparationGuidance.focusAreas.filter(
      (area) => !isUnsafe(area.title) && !isUnsafe(area.guidance),
    );

    const recommendedActionUnsafe = isUnsafe(insight.recommendedAction.action) || isUnsafe(insight.recommendedAction.rationale);

    return {
      ...insight,
      aiInterpretation: {
        likelyPriorities: filterList(insight.aiInterpretation.likelyPriorities),
        positioningSuggestions: filterList(insight.aiInterpretation.positioningSuggestions),
        evidenceToHighlight: filterList(insight.aiInterpretation.evidenceToHighlight),
        areasToStrengthen: filterList(insight.aiInterpretation.areasToStrengthen),
      },
      preparationGuidance: {
        focusAreas: safeFocusAreas,
        deadlineAwareNotes: filterList(insight.preparationGuidance.deadlineAwareNotes),
      },
      recommendedAction: recommendedActionUnsafe
        ? {
            action: nextBestAction,
            rationale: 'Time remaining is limited, so this mirrors the deterministic recommendation for this deadline window.',
          }
        : insight.recommendedAction,
    };
  }

  return insight;
}
