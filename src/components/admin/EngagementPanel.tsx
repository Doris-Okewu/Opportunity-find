import { useCallback, useEffect, useState } from 'react';
import { getAdminEngagement } from '../../lib/queries/analytics';
import type { AdminEngagement, EngagementBreakdownRow } from '../../lib/queries/analytics';
import { APPLICATION_STATUS_LABELS } from '../../features/applications/applicationsStore';
import type { ApplicationStatus } from '../../features/applications/applicationsStore';
import Spinner from '../ui/Spinner';
import ErrorState from '../opportunities/ErrorState';

const FEATURES: { key: string; label: string }[] = [
  { key: 'visits', label: 'Visits' },
  { key: 'page_views', label: 'Page views' },
  { key: 'opportunity_views', label: 'Opp. views' },
  { key: 'apply_clicks', label: 'Apply clicks' },
  { key: 'search_filter', label: 'Search/filter' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'tracker', label: 'Tracker' },
  { key: 'sign_ins', label: 'Sign-ins' },
  { key: 'community_joins', label: 'Joins' },
  { key: 'community_posts', label: 'Posts' },
  { key: 'community_comments', label: 'Comments' },
];

function Tile({ label, value, hint }: { label: string; value: number | undefined; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{(value ?? 0).toLocaleString()}</p>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold text-ink">{title}</h3>
      {note && <p className="mb-2 text-xs text-ink-3">{note}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function BreakdownList({ title, rows, format }: { title: string; rows: EngagementBreakdownRow[]; format?: (d: string) => string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-3">None recorded yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.slice(0, 10).map((r) => (
            <li key={`${r.event_type}-${r.detail}`} className="flex justify-between gap-3">
              <span className="truncate text-ink-2">{format ? format(r.detail) : r.detail || '—'}</span>
              <span className="shrink-0 tabular-nums text-ink">
                {r.events} <span className="text-ink-3">({r.unique_visitors} visitors)</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Evidence of real usage during the pilot. Counts come from anonymous,
 * per-browser events (admin traffic excluded) plus authoritative database
 * counts for accounts and community activity. Nothing here is estimated.
 */
export default function EngagementPanel({ days }: { days: number }) {
  const [data, setData] = useState<AdminEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminEngagement(days));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engagement analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6 text-brand" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-2">
        <ErrorState message={error} onRetry={load} />
        <p className="text-sm text-ink-2">
          If this says the functions are not installed, apply <code>supabase/migrations/20261113000000_site_events.sql</code>.
        </p>
      </div>
    );
  }
  if (!data) return null;

  const s = data.summary;
  const byDay = new Map<string, Map<string, number>>();
  for (const row of data.daily) {
    if (!byDay.has(row.day)) byDay.set(row.day, new Map());
    byDay.get(row.day)!.set(row.feature, row.events);
  }
  const days_ = [...byDay.keys()].sort().reverse();
  const rowsOf = (type: string) => data.breakdown.filter((r) => r.event_type === type);
  const onboarding = [...rowsOf('onboarding_complete'), ...rowsOf('preferences_updated')];

  return (
    <div className="space-y-6">
      <Group
        title="Reach"
        note="Visitors are counted per browser (anonymous id, stored only as a hash). A visit is a browser session that ends after 30 minutes of inactivity. Admin traffic is excluded."
      >
        <Tile label="Unique visitors" value={s.unique_visitors} hint="Distinct browsers" />
        <Tile label="Total visits" value={s.visits} />
        <Tile label="Page views" value={s.page_views} />
        <Tile label="Opportunity views" value={s.opportunity_views} hint={`${s.opportunity_viewers ?? 0} unique viewers`} />
        <Tile label="Anonymous visitors" value={s.visitors_anonymous} hint="Browsers not signed in" />
        <Tile label="Signed-in visitors" value={s.visitors_registered} hint="Registered, not in a community" />
        <Tile label="Community-member visitors" value={s.visitors_member} hint="Joined ≥1 community" />
        <Tile label="Apply-link clicks" value={s.apply_clicks} hint="Official link opened — not a submitted application" />
      </Group>

      <Group title="Search, filters and recommendations">
        <Tile label="Searches" value={s.searches} hint={`${s.searchers ?? 0} visitors · search text is not recorded`} />
        <Tile label="Filter changes" value={s.filter_changes} hint={`${s.filter_users ?? 0} visitors`} />
        <Tile label="Onboarding completed" value={s.onboarding_completions} hint={`${s.preferences_updates ?? 0} preference edits`} />
        <Tile label="Recommendation views" value={s.recommendation_views} hint={`${s.recommendation_viewers ?? 0} visitors · clicks: ${s.recommendation_clicks ?? 0}`} />
      </Group>

      <Group title="Application tracker" note="Tracker data stays in each user's browser; only these counts are recorded. Status updates are self-reported, not verified applications.">
        <Tile label="Tracker additions" value={s.tracker_adds} hint={`${s.tracker_users ?? 0} visitors`} />
        <Tile label="Self-reported status updates" value={s.tracker_status_changes} />
      </Group>

      <Group title="Community" note="Accounts, joins, posts, comments and reports are counted directly from the database. Admin accounts excluded from account counts.">
        <Tile label="Accounts created" value={s.accounts_created} hint={`${s.accounts_confirmed ?? 0} confirmed email`} />
        <Tile label="Sign-ins" value={s.sign_ins} />
        <Tile label="Display names set" value={s.profiles_created} />
        <Tile label="Community joins" value={s.community_joins} hint="Still-active memberships" />
        <Tile label="Posts" value={s.community_posts} />
        <Tile label="Comments" value={s.community_comments} />
        <Tile label="Reports filed" value={s.content_reports} />
      </Group>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownList title="Top pages" rows={rowsOf('page_view')} />
        <BreakdownList title="Filters used" rows={rowsOf('filter_change')} />
        <BreakdownList title="Onboarding (path:level)" rows={onboarding} />
        <BreakdownList
          title="Tracker status updates"
          rows={rowsOf('tracker_status_change')}
          format={(d) => APPLICATION_STATUS_LABELS[d as ApplicationStatus] ?? d}
        />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">Activity by date and feature (UTC, events)</h3>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2">Date</th>
                {FEATURES.map((f) => (
                  <th key={f.key} scope="col" className="px-3 py-2 text-right">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {days_.length === 0 && (
                <tr>
                  <td colSpan={FEATURES.length + 1} className="px-3 py-6 text-center text-ink-3">
                    No activity recorded in this period yet.
                  </td>
                </tr>
              )}
              {days_.map((d) => (
                <tr key={d}>
                  <td className="px-3 py-2 tabular-nums text-ink-2">{d}</td>
                  {FEATURES.map((f) => (
                    <td key={f.key} className="px-3 py-2 text-right tabular-nums">
                      {byDay.get(d)?.get(f.key) ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
