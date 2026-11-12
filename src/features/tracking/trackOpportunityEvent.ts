import { supabase } from '../../lib/supabaseClient';

// Anonymous, browser-scoped visitor id used ONLY for aggregate opportunity
// analytics (unique viewers / appliers). Deliberately separate from the AI
// client id (features/intelligence/ai/clientId.ts) so the two can never be
// joined. The server stores only a SHA-256 hash of this value, and admins
// only ever see aggregate counts.
const VISITOR_ID_STORAGE_KEY = 'opportunity-find-visitor-id';

export type OpportunityEventType = 'detail_view' | 'apply_click';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let memoryVisitorId: string | null = null;

function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = generateId();
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    // Storage unavailable: keep one id for this page session.
    memoryVisitorId ??= generateId();
    return memoryVisitorId;
  }
}

// Prevents duplicate detail_view events from re-renders / StrictMode double
// effects within one page session. The server also de-duplicates.
const sentThisSession = new Set<string>();

/**
 * Fire-and-forget. Never throws, never awaited by callers, so it can never
 * delay navigation or the external Apply link.
 */
export function trackOpportunityEvent(opportunityId: string, eventType: OpportunityEventType): void {
  const key = `${eventType}:${opportunityId}`;
  if (eventType === 'detail_view' && sentThisSession.has(key)) return;
  sentThisSession.add(key);

  try {
    void supabase
      .rpc('track_opportunity_event', {
        p_opportunity_id: opportunityId,
        p_event_type: eventType,
        p_visitor_id: getVisitorId(),
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // Swallow: analytics must never affect the user flow.
  }
}
