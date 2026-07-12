import { CORS_HEADERS, handleCorsPreflight } from '../_shared/cors.ts';
import { validateRequest } from './requestValidation.ts';
import { buildSystemInstruction, buildUserContent } from './promptBuilder.ts';
import { callAIProvider } from './geminiProvider.ts';
import { validateAndCorrectResponse } from './responseValidation.ts';
import { IN_MEMORY_CIRCUIT_BREAKER_MAX_CALLS } from './config.ts';
import type { AIInsightResponseBody } from './types.ts';

/**
 * Best-effort, per-instance call counter. This resets on cold start and is
 * NOT shared across concurrent instances, so it is not a reliable global
 * daily budget — see README.md for why real enforcement needs a database
 * table (a separate, reviewed migration). It only guards against a single
 * warm instance taking an unbounded number of calls.
 */
let instanceCallCount = 0;

function jsonResponse(body: AIInsightResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return jsonResponse({ available: false, reason: 'invalid_request', message: 'Method not allowed.' }, 405);
  }

  if (instanceCallCount >= IN_MEMORY_CIRCUIT_BREAKER_MAX_CALLS) {
    return jsonResponse(
      {
        available: false,
        reason: 'circuit_breaker',
        message: 'AI insight has reached its temporary request limit. Please try again later.',
      },
      503,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ available: false, reason: 'invalid_request', message: 'Request body must be valid JSON.' }, 400);
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return jsonResponse({ available: false, reason: 'invalid_request', message: validation.error }, 400);
  }

  const request = validation.value;
  instanceCallCount += 1;

  const systemInstruction = buildSystemInstruction();
  const userContent = buildUserContent(request);

  const providerResult = await callAIProvider({ systemInstruction, userContent });

  if (!providerResult.ok) {
    // Log only a safe, non-sensitive marker — never the API key, never the
    // full request/response body.
    console.error(`AI insight: provider call failed (${providerResult.reason}) for opportunity request.`);
    return jsonResponse(
      { available: false, reason: 'provider_unavailable', message: providerResult.safeMessage },
      502,
    );
  }

  const validated = validateAndCorrectResponse(providerResult.rawText, request);
  if (!validated.ok || !validated.insight) {
    console.error(`AI insight: model output failed validation (${validated.failureReason}).`);
    return jsonResponse(
      {
        available: false,
        reason: 'invalid_model_output',
        message: 'AI insight could not be generated in a safe, structured format this time.',
      },
      502,
    );
  }

  // Server sets these rather than trusting whatever the model produced,
  // so they can't be spoofed or malformed by the model output.
  const insight = {
    ...validated.insight,
    schemaVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    opportunityId: request.opportunity.id,
  };

  return jsonResponse({ available: true, insight }, 200);
});
