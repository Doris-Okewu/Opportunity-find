import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';
import type { AIInsightRequestPayload, AIInsightResponseBody, AIOpportunityInsight } from './types';

/** Client-side timeout — kept above the Edge Function's own 50s worst
 * case (one 40s attempt plus at most one retry within the budget), so a
 * slow-but-alive call can return its own result or clean failure before
 * we give up locally. */
export const CLIENT_TIMEOUT_MS = 55_000;

/**
 * The function answers failures with a JSON body and a non-2xx status
 * (400/502/503). supabase-js reports those as an error, so read the body
 * to show the function's own safe message instead of a generic
 * "could not reach" that hides what actually happened.
 */
async function messageFromHttpError(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = (await (error.context as Response).json()) as Partial<{ available: boolean; message: string }>;
    return body && body.available === false && typeof body.message === 'string' ? body.message : null;
  } catch {
    return null;
  }
}

export type AIInsightOutcome =
  | { kind: 'success'; insight: AIOpportunityInsight }
  | { kind: 'unavailable'; message: string }
  | { kind: 'timeout' }
  | { kind: 'network_error'; message: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('client_timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Invokes the ai-opportunity-insight Edge Function. Never throws — every
 * outcome (success, a clean "unavailable" from the function, a client-side
 * timeout, or a network failure) is represented in the returned union so
 * the calling hook can render the right state without a try/catch.
 */
export async function requestAIInsight(payload: AIInsightRequestPayload): Promise<AIInsightOutcome> {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke<AIInsightResponseBody>('ai-opportunity-insight', { body: payload }),
      CLIENT_TIMEOUT_MS,
    );

    if (error) {
      const serverMessage = await messageFromHttpError(error);
      if (serverMessage) return { kind: 'unavailable', message: serverMessage };
      return { kind: 'network_error', message: 'Could not reach the AI insight service. Check your connection and try again.' };
    }
    if (!data) {
      return { kind: 'network_error', message: 'No response was received from the AI insight service.' };
    }
    if (!data.available) {
      return { kind: 'unavailable', message: data.message };
    }
    return { kind: 'success', insight: data.insight };
  } catch (err) {
    if (err instanceof Error && err.message === 'client_timeout') {
      return { kind: 'timeout' };
    }
    return { kind: 'network_error', message: 'Could not reach the AI insight service.' };
  }
}
