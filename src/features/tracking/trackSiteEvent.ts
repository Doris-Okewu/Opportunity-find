import { supabase } from '../../lib/supabaseClient';
import { getVisitorId } from './trackOpportunityEvent';

// Product-usage analytics for the pilot. Sends only an event name, a short
// non-personal detail code (e.g. a route pattern, "type:internship", a
// status value) and an optional opportunity id. Never sends search text,
// notes, emails or any free text — the server also rejects details that
// aren't simple lowercase codes. The visitor id is the same anonymous,
// browser-scoped id used for opportunity views and is stored only as a
// SHA-256 hash server-side. Whether the caller is anonymous / registered /
// a community member is decided server-side from the auth session.

export type SiteEventType =
  | 'visit_start'
  | 'page_view'
  | 'search'
  | 'filter_change'
  | 'onboarding_complete'
  | 'preferences_updated'
  | 'recommendations_view'
  | 'recommendation_click'
  | 'tracker_add'
  | 'tracker_status_change'
  | 'sign_in';

const SESSION_KEY = 'opportunity-find-session';
const SESSION_IDLE_MS = 30 * 60 * 1000;

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

let memorySession: { id: string; last: number } | null = null;

/** A "visit" = a browser-tab session that ends after 30 minutes idle. */
function getSession(): { id: string; isNew: boolean } {
  const now = Date.now();
  let current: { id: string; last: number } | null = memorySession;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) current = JSON.parse(raw) as { id: string; last: number };
  } catch {
    // fall back to memory
  }
  const isNew = !current || typeof current.id !== 'string' || now - current.last > SESSION_IDLE_MS;
  const next = { id: isNew || !current ? randomId() : current.id, last: now };
  memorySession = next;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return { id: next.id, isNew };
}

function sanitizeDetail(detail: string): string {
  return detail
    .toLowerCase()
    .replace(/[^a-z0-9_:/.-]+/g, '-')
    .slice(0, 80);
}

// Client-side de-duplication (StrictMode double effects, re-renders). The
// server de-duplicates again.
const recent = new Map<string, number>();

function send(eventType: SiteEventType, sessionId: string, detail: string, opportunityId: string | null) {
  try {
    void supabase
      .rpc('track_site_event', {
        p_event_type: eventType,
        p_visitor_id: getVisitorId(),
        p_session_id: sessionId,
        p_detail: detail,
        p_opportunity_id: opportunityId,
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // Analytics must never affect the user flow.
  }
}

/** Fire-and-forget. Never throws and is never awaited by callers. */
export function trackSiteEvent(
  eventType: Exclude<SiteEventType, 'visit_start'>,
  options: { detail?: string; opportunityId?: string | null } = {},
): void {
  try {
    const detail = sanitizeDetail(options.detail ?? '');
    const key = `${eventType}|${detail}|${options.opportunityId ?? ''}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last !== undefined && now - last < 2000) return;
    recent.set(key, now);

    const session = getSession();
    if (session.isNew) send('visit_start', session.id, '', null);
    send(eventType, session.id, detail, options.opportunityId ?? null);
  } catch {
    // ignore
  }
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Route pattern without ids or query strings, e.g. "/opportunities/:id". */
export function normalizePath(pathname: string): string {
  return pathname.replace(UUID_RE, ':id').replace(/\/+$/, '') || '/';
}
