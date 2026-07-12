// Central, server-side-only configuration for this function. Nothing here
// is a secret — the actual API key is read directly from Deno.env in
// geminiProvider.ts and never passed through this file.

/** Overridable via the GEMINI_MODEL Edge Function secret/env var. */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function getGeminiModel(): string {
  return Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
}

/** Server-side timeout for the outbound Gemini call. Kept below the
 * client's 30s timeout so the client isn't left hanging past the point
 * the server has already given up. */
export const GEMINI_CALL_TIMEOUT_MS = 25_000;

/** Free-text length caps applied during request sanitization. */
export const LIMITS = {
  title: 300,
  organization: 300,
  description: 4000,
  location: 120,
  maxArrayItems: 20,
  arrayItemLength: 200,
  uuid: 100,
};

/**
 * Hard ceiling on total Gemini calls this function instance will make
 * before refusing further requests. This resets whenever the underlying
 * Edge Function instance restarts/cold-starts, so it is NOT a reliable
 * global daily budget — see the README for why persistent enforcement
 * requires a database table (a future, separately-reviewed migration).
 * It exists purely as a cheap best-effort guard against a single runaway
 * burst of traffic hitting one warm instance.
 */
export const IN_MEMORY_CIRCUIT_BREAKER_MAX_CALLS = Number(Deno.env.get('AI_INSIGHT_MAX_CALLS_PER_INSTANCE')) || 500;
