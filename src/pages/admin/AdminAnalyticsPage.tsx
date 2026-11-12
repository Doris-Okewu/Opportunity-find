import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAnalytics, AnalyticsNotInstalledError } from '../../lib/queries/analytics';
import type { AdminAnalytics } from '../../lib/queries/analytics';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/opportunities/ErrorState';

const RANGES = [7, 30, 90] as const;

function pct(part: number, whole: number): string {
  if (whole === 0) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

function DailyBars({ daily }: { daily: AdminAnalytics['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.detail_views));
  return (
    <div className="overflow-x-auto">
      <div className="flex h-32 min-w-full items-end gap-0.5" role="img" aria-label="Daily detail views">
        {daily.map((d) => (
          <div
            key={d.day}
            className="flex-1 rounded-t bg-brand/70"
            style={{ height: `${(d.detail_views / max) * 100}%`, minWidth: '4px', minHeight: d.detail_views ? '2px' : 0 }}
            title={`${d.day}: ${d.detail_views} views, ${d.apply_clicks} apply clicks`}
          />
        ))}
      </div>
      {daily.length > 0 && (
        <div className="mt-1 flex justify-between text-xs text-ink-3">
          <span>{daily[0].day}</span>
          <span>{daily[daily.length - 1].day} (UTC)</span>
        </div>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notInstalled, setNotInstalled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotInstalled(false);
    try {
      setData(await getAdminAnalytics(days));
    } catch (err) {
      if (err instanceof AnalyticsNotInstalledError) setNotInstalled(true);
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/admin" className="mb-6 inline-block text-sm font-medium text-brand">
        &larr; Back to Dashboard
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-ink-2">
            Anonymous, aggregate counts only. Apply clicks mean the official link was opened — not that an application
            was submitted.
          </p>
        </div>
        <div className="w-40">
          <label htmlFor="analytics-range" className="mb-1 block text-xs font-semibold text-ink-2">
            Time range
          </label>
          <Select id="analytics-range" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r} value={r}>
                Last {r} days
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="space-y-3">
          <ErrorState message={error} onRetry={load} />
          {notInstalled && (
            <p className="text-sm text-ink-2">
              File: <code>supabase/migrations/20261112000000_opportunity_events.sql</code>
            </p>
          )}
        </div>
      )}

      {!error && loading && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6 text-brand" />
        </div>
      )}

      {!error && !loading && data && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatTile label="Detail views" value={data.summary.detail_views.toLocaleString()} />
            <StatTile label="Unique viewers" value={data.summary.unique_viewers.toLocaleString()} hint="Per browser" />
            <StatTile label="Apply clicks" value={data.summary.apply_clicks.toLocaleString()} />
            <StatTile label="Unique appliers" value={data.summary.unique_appliers.toLocaleString()} hint="Per browser" />
            <StatTile
              label="Click-through"
              value={pct(data.summary.unique_appliers, data.summary.unique_viewers)}
              hint="Unique appliers ÷ viewers"
            />
          </div>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-ink">Daily detail views</h2>
            {data.summary.detail_views === 0 ? (
              <p className="text-sm text-ink-3">No views recorded in this period yet.</p>
            ) : (
              <DailyBars daily={data.daily} />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">By opportunity</h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-3">
                  <tr>
                    <th scope="col" className="px-4 py-3">Opportunity</th>
                    <th scope="col" className="px-4 py-3 text-right">Views</th>
                    <th scope="col" className="px-4 py-3 text-right">Unique viewers</th>
                    <th scope="col" className="px-4 py-3 text-right">Apply clicks</th>
                    <th scope="col" className="px-4 py-3 text-right">Unique appliers</th>
                    <th scope="col" className="px-4 py-3 text-right">Click-through</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.byOpportunity.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-ink-3">
                        No opportunities.
                      </td>
                    </tr>
                  )}
                  {data.byOpportunity.map((row) => (
                    <tr key={row.opportunity_id}>
                      <td className="px-4 py-3">
                        <Link to={`/admin/opportunities/${row.opportunity_id}/edit`} className="font-medium text-ink hover:text-brand">
                          {row.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-3">
                          <span>{row.organization}</span>
                          {!row.is_published && <Badge>Unpublished</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.detail_views}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.unique_viewers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.apply_clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.unique_appliers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{pct(row.unique_appliers, row.unique_viewers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
