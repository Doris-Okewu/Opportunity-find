import { GEMINI_CALL_TIMEOUT_MS, getGeminiModel } from './config.ts';

/**
 * Gemini's structured-output schema format (a restricted subset of
 * OpenAPI/JSON Schema, using uppercase type names). This is intentionally
 * confined to this file — nothing outside geminiProvider.ts needs to know
 * this shape. If a second provider is added later, it gets its own
 * provider file with its own schema translation; callers only ever see
 * the provider-agnostic result type below.
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    schemaVersion: { type: 'INTEGER' },
    generatedAt: { type: 'STRING' },
    opportunityId: { type: 'STRING' },
    officialInformation: {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        statedRequirements: { type: 'ARRAY', items: { type: 'STRING' } },
        source: { type: 'STRING', enum: ['opportunity_record'] },
      },
      required: ['summary', 'statedRequirements', 'source'],
    },
    informationAvailability: {
      type: 'OBJECT',
      properties: {
        officialEligibility: { type: 'STRING', enum: ['available', 'not_available'] },
        officialSelectionCriteria: { type: 'STRING', enum: ['available', 'not_available'] },
        organizationMission: { type: 'STRING', enum: ['available', 'not_available'] },
        verifiedPublicResearch: { type: 'STRING', enum: ['not_performed'] },
      },
      required: ['officialEligibility', 'officialSelectionCriteria', 'organizationMission', 'verifiedPublicResearch'],
    },
    aiInterpretation: {
      type: 'OBJECT',
      properties: {
        likelyPriorities: { type: 'ARRAY', items: { type: 'STRING' } },
        positioningSuggestions: { type: 'ARRAY', items: { type: 'STRING' } },
        evidenceToHighlight: { type: 'ARRAY', items: { type: 'STRING' } },
        areasToStrengthen: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['likelyPriorities', 'positioningSuggestions', 'evidenceToHighlight', 'areasToStrengthen'],
    },
    preparationGuidance: {
      type: 'OBJECT',
      properties: {
        focusAreas: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              guidance: { type: 'STRING' },
            },
            required: ['title', 'guidance'],
          },
        },
        deadlineAwareNotes: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['focusAreas', 'deadlineAwareNotes'],
    },
    recommendedAction: {
      type: 'OBJECT',
      properties: {
        action: { type: 'STRING' },
        rationale: { type: 'STRING' },
      },
      required: ['action', 'rationale'],
    },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    caveats: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'schemaVersion',
    'generatedAt',
    'opportunityId',
    'officialInformation',
    'informationAvailability',
    'aiInterpretation',
    'preparationGuidance',
    'recommendedAction',
    'confidence',
    'caveats',
  ],
};

export interface AIProviderInput {
  systemInstruction: string;
  userContent: string;
}

export type AIProviderResult =
  | { ok: true; rawText: string }
  | { ok: false; reason: 'timeout' | 'network_error' | 'provider_error' | 'missing_key'; safeMessage: string };

/**
 * Calls Gemini and returns the raw (unvalidated) JSON text it produced.
 * Response-shape validation against our own AIOpportunityInsight type
 * happens separately in responseValidation.ts — this file's only job is
 * talking to Gemini and translating its errors into a safe, generic
 * result the rest of the function can handle without ever seeing or
 * logging the API key or Gemini's raw error body.
 */
export async function callAIProvider(input: AIProviderInput): Promise<AIProviderResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    // Never log this beyond a generic marker — the absence of a key is a
    // deployment/config issue, not something to expose to the caller.
    console.error('AI insight: GEMINI_API_KEY is not configured on this Edge Function.');
    return { ok: false, reason: 'missing_key', safeMessage: 'AI insight is not configured on this deployment.' };
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_CALL_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // Header-based key, not a URL query parameter, so it never ends up
        // in server/proxy access logs that record request URLs.
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: input.userContent }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          maxOutputTokens: 2048,
          temperature: 0.4,
          // maxOutputTokens is a combined budget for thinking + visible
          // output; this task is structured extraction, not open-ended
          // reasoning, so disable thinking to keep the full budget
          // available for the actual JSON answer.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!res.ok) {
      // Read but do not forward the body — it may contain provider-side
      // diagnostic detail we don't want to leak to the browser, and we
      // never log request/response bodies here (no API key in this body,
      // but keep the practice consistent).
      console.error(`AI insight: Gemini responded with HTTP ${res.status}.`);
      return { ok: false, reason: 'provider_error', safeMessage: 'The AI provider returned an error.' };
    }

    const data = await res.json();
    // Thinking-capable models can return reasoning/"thought" parts ahead of
    // the final answer part in candidates[0].content.parts, so the final
    // JSON is not reliably at index 0 — select the first part that isn't
    // flagged as a thought and actually has text.
    const parts: unknown = data?.candidates?.[0]?.content?.parts;
    const answerPart = Array.isArray(parts)
      ? parts.find(
          (part: unknown): part is { text: string } =>
            typeof part === 'object' &&
            part !== null &&
            (part as { thought?: unknown }).thought !== true &&
            typeof (part as { text?: unknown }).text === 'string' &&
            (part as { text: string }).text.trim().length > 0,
        )
      : undefined;
    const text: unknown = answerPart?.text;

    if (typeof text !== 'string' || text.trim().length === 0) {
      console.error('AI insight: Gemini response had no usable text content.');
      return { ok: false, reason: 'provider_error', safeMessage: 'The AI provider returned an empty response.' };
    }

    return { ok: true, rawText: text };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, reason: 'timeout', safeMessage: 'The AI provider took too long to respond.' };
    }
    console.error('AI insight: network error calling Gemini.', err instanceof Error ? err.message : 'unknown error');
    return { ok: false, reason: 'network_error', safeMessage: 'Could not reach the AI provider.' };
  } finally {
    clearTimeout(timeout);
  }
}
