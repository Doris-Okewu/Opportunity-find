import { supabase } from '../supabaseClient';

// Admin-only aggregate analytics. Each RPC is SECURITY DEFINER on the server
// and raises unless the caller is in `admins`. No raw events or visitor
// identifiers are ever returned. See supabase/migrations/*_opportunity_events.sql.

export interface AnalyticsSummary {
  detail_views: number;
  unique_viewers: number;
  apply_clicks: number;
  unique_appliers: number;
}

export interface OpportunityAnalyticsRow {
  opportunity_id: string;
  title: string;
  organization: string;
  is_published: boolean;
  deadline: string | null;
  detail_views: number;
  unique_viewers: number;
  apply_clicks: number;
  unique_appliers: number;
}

export interface DailyAnalyticsRow {
  day: string;
  detail_views: number;
  apply_clicks: number;
}

export interface AdminAnalytics {
  summary: AnalyticsSummary;
  byOpportunity: OpportunityAnalyticsRow[];
  daily: DailyAnalyticsRow[];
}

// bigint columns can arrive as strings via PostgREST; normalise to numbers.
function n(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export class AnalyticsNotInstalledError extends Error {}

function rethrow(error: { code?: string; message: string }): never {
  // PGRST202 = function not found (migration not yet applied).
  if (error.code === 'PGRST202' || /could not find the function/i.test(error.message)) {
    throw new AnalyticsNotInstalledError(
      'Analytics functions are not installed in the database yet. Run the opportunity_events migration in the Supabase SQL Editor.',
    );
  }
  throw new Error(error.message);
}

export async function getAdminAnalytics(days: number): Promise<AdminAnalytics> {
  const args = { p_days: days };
  const [summaryRes, byOppRes, dailyRes] = await Promise.all([
    supabase.rpc('admin_analytics_summary', args),
    supabase.rpc('admin_analytics_by_opportunity', args),
    supabase.rpc('admin_analytics_daily', args),
  ]);

  if (summaryRes.error) rethrow(summaryRes.error);
  if (byOppRes.error) rethrow(byOppRes.error);
  if (dailyRes.error) rethrow(dailyRes.error);

  const s = (Array.isArray(summaryRes.data) ? summaryRes.data[0] : summaryRes.data) ?? {};

  return {
    summary: {
      detail_views: n(s.detail_views),
      unique_viewers: n(s.unique_viewers),
      apply_clicks: n(s.apply_clicks),
      unique_appliers: n(s.unique_appliers),
    },
    byOpportunity: ((byOppRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      opportunity_id: String(r.opportunity_id),
      title: String(r.title ?? ''),
      organization: String(r.organization ?? ''),
      is_published: Boolean(r.is_published),
      deadline: typeof r.deadline === 'string' ? r.deadline : null,
      detail_views: n(r.detail_views),
      unique_viewers: n(r.unique_viewers),
      apply_clicks: n(r.apply_clicks),
      unique_appliers: n(r.unique_appliers),
    })),
    daily: ((dailyRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      day: String(r.day),
      detail_views: n(r.detail_views),
      apply_clicks: n(r.apply_clicks),
    })),
  };
}
