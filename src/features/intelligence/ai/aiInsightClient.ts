import { supabase } from '../../../lib/supabaseClient';
import type { AIInsightRequestPayload, AIInsightResponseBody, AIOpportunityInsight } from './types';

/** Client-side timeout — kept above the Edge Function's own 25s Gemini
 * timeout, so a slow-but-alive function call has a chance to return its
 * own clean failure before we give up locally. */
export const CLIENT_TIMEOUT_MS = 30_000;

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
      return { kind: 'network_error', message: 'Could not reach the AI insight service.' };
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
