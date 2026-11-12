// opportunity-sourcing — scheduled discovery, verification and maintenance.
//
// Invoked by pg_cron (via pg_net, authenticated with the Vault secret in the
// `x-cron-secret` header) or manually by an admin from the dashboard (their
// Supabase session JWT). Writes with the service role, server-side only.
//
// Jobs:
//   discover — fetch enabled sources, normalise, de-duplicate, verify links,
//              auto-publish verified records, queue the rest for review
//   maintain — re-check application links of active listings, then archive
//              expired / unlisted records
import { createClient } from 'npm:@supabase/supabase-js@2.110.2';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.2';
import { CORS_HEADERS, handleCorsPreflight } from '../_shared/cors.ts';
import { checkLink, fetchSource, isSourceDue, mapLimit } from './sources.ts';
import type { SourceConfig } from './sources.ts';
import { normalize } from './normalize.ts';
import type { OpportunityType } from './normalize.ts';

const RUN_BUDGET_MS = 110_000; // stay inside the Edge Function wall-clock limit
const MAX_NEW_PER_SOURCE = 40;
const LINK_CHECK_CONCURRENCY = 5;
const MAINTAIN_BATCH = 60;

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface SourceRow extends SourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  auto_publish: boolean;
  min_interval_minutes: number;
  last_run_at: string | null;
  consecutive_failures: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function authorize(req: Request, db: SupabaseClient): Promise<'schedule' | 'manual' | null> {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret) {
    const { data, error } = await db.rpc('get_sourcing_cron_secret');
    if (!error && typeof data === 'string' && data.length > 0 && timingSafeEqual(cronSecret, data)) return 'schedule';
    return null;
  }
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const { data: userRes, error } = await db.auth.getUser(token);
  if (error || !userRes.user) return null;
  const { data: admin } = await db.from('admins').select('user_id').eq('user_id', userRes.user.id).maybeSingle();
  return admin ? 'manual' : null;
}

// ── discover ─────────────────────────────────────────────────────────────
async function discoverSource(db: SupabaseClient, src: SourceRow, deadlineAt: number) {
  const stats = { fetched: 0, rejected: 0, duplicates: 0, seen_again: 0, published: 0, queued_for_review: 0, broken_links: 0, rejected_reasons: {} as Record<string, number> };
  const raw = await fetchSource(src);
  stats.fetched = raw.length;

  const { data: existingRows, error: exErr } = await db
    .from('opportunities')
    .select('id, source_external_id')
    .eq('source_id', src.id);
  if (exErr) throw new Error(`DB read failed: ${exErr.message}`);
  const existing = new Map((existingRows ?? []).map((r) => [r.source_external_id as string, r.id as string]));

  const candidates = [];
  const seenIds: string[] = [];
  for (const item of raw) {
    const res = normalize(item, { defaultType: (src.config.default_type as OpportunityType | undefined) ?? undefined });
    if (!res.ok) {
      stats.rejected++;
      stats.rejected_reasons[res.reason] = (stats.rejected_reasons[res.reason] ?? 0) + 1;
      continue;
    }
    const known = existing.get(res.record.source_external_id);
    if (known) {
      seenIds.push(known);
      continue;
    }
    candidates.push(res);
  }

  // Still listed by the source = re-verified at the source.
  if (seenIds.length) {
    const now = new Date().toISOString();
    for (let i = 0; i < seenIds.length; i += 200) {
      await db.from('opportunities').update({ last_seen_at: now }).in('id', seenIds.slice(i, i + 200));
    }
    stats.seen_again = seenIds.length;
  }

  // Cross-source / manual duplicates by canonical URL.
  const urls = candidates.map((c) => c.record.canonical_url);
  const dupUrls = new Set<string>();
  const dupAppUrls = new Set<string>();
  const appUrls = candidates.map((c) => c.record.application_url);
  for (let i = 0; i < urls.length; i += 100) {
    const [byCanonical, byApp] = await Promise.all([
      db.from('opportunities').select('canonical_url').in('canonical_url', urls.slice(i, i + 100)),
      // Manually added listings have no canonical_url, so also match the raw link.
      db.from('opportunities').select('application_url').in('application_url', appUrls.slice(i, i + 100)),
    ]);
    for (const r of byCanonical.data ?? []) dupUrls.add(r.canonical_url as string);
    for (const r of byApp.data ?? []) dupAppUrls.add(r.application_url as string);
  }
  const fresh = candidates.filter((c) => {
    if (dupUrls.has(c.record.canonical_url) || dupAppUrls.has(c.record.application_url)) {
      stats.duplicates++;
      return false;
    }
    dupUrls.add(c.record.canonical_url); // also de-dupe within this batch
    return true;
  }).slice(0, MAX_NEW_PER_SOURCE);

  // Verify links (auto-publish candidates must resolve).
  const checked = await mapLimit(fresh, LINK_CHECK_CONCURRENCY, async (c) => {
    if (Date.now() > deadlineAt) return { c, link: { status: 'unknown' as const, code: null } };
    return { c, link: await checkLink(c.record.application_url) };
  });

  const now = new Date().toISOString();
  for (const { c, link } of checked) {
    if (link.status === 'broken') {
      stats.broken_links++;
      continue; // never import a dead link
    }
    const reasons = [...c.reviewReasons];
    if (link.status !== 'ok') reasons.push(`Application link could not be verified automatically${link.code ? ` (HTTP ${link.code})` : ''}`);
    if (!src.auto_publish) reasons.push(`Source "${src.name}" requires admin review`);
    const publish = reasons.length === 0;

    const { error } = await db.from('opportunities').insert({
      ...c.record,
      is_published: publish,
      status: publish ? 'active' : 'pending_review',
      review_reason: publish ? null : [...new Set(reasons)].join(' · ').slice(0, 500),
      source_id: src.id,
      source_name: src.name,
      discovered_at: now,
      last_seen_at: now,
      last_verified_at: link.status === 'ok' ? now : null,
      link_status: link.status,
      link_checked_at: now,
      auto_classified: true,
    });
    if (error) {
      if (error.code === '23505') stats.duplicates++;
      else throw new Error(`DB insert failed: ${error.message}`);
      continue;
    }
    if (publish) stats.published++;
    else stats.queued_for_review++;
  }
  return stats;
}

async function runDiscover(db: SupabaseClient, trigger: 'schedule' | 'manual', onlySlug: string | null) {
  const { data: runId, error: lockErr } = await db.rpc('start_sourcing_run', { p_job: 'discover', p_trigger: trigger, p_source_slug: onlySlug });
  if (lockErr) throw new Error(lockErr.message);
  if (runId === null) return { status: 'skipped', reason: 'A discovery run is already in progress.' };

  const startedAt = Date.now();
  const deadlineAt = startedAt + RUN_BUDGET_MS;
  let query = db.from('opportunity_sources').select('*').order('last_run_at', { ascending: true, nullsFirst: true });
  query = onlySlug ? query.eq('slug', onlySlug) : query.eq('enabled', true);
  const { data: sources, error } = await query;
  if (error) {
    await db.from('sourcing_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error: error.message }).eq('id', runId);
    throw new Error(error.message);
  }

  const results: Record<string, unknown> = {};
  let ok = 0;
  let failed = 0;
  for (const src of (sources ?? []) as SourceRow[]) {
    if (Date.now() > deadlineAt - 15_000) {
      results[src.slug] = { skipped: 'time budget reached; will run next time' };
      continue;
    }
    const due = isSourceDue(src.last_run_at, src.min_interval_minutes);
    if (trigger === 'schedule' && !due) {
      results[src.slug] = { skipped: 'minimum interval not reached' };
      continue;
    }
    const t0 = Date.now();
    try {
      const stats = await discoverSource(db, src, deadlineAt);
      ok++;
      results[src.slug] = { ...stats, ms: Date.now() - t0 };
      await db.from('opportunity_sources').update({
        last_run_at: new Date().toISOString(), last_success_at: new Date().toISOString(),
        last_error: null, consecutive_failures: 0, last_stats: stats,
      }).eq('id', src.id);
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      results[src.slug] = { error: message, ms: Date.now() - t0 };
      await db.from('opportunity_sources').update({
        last_run_at: new Date().toISOString(), last_error: message.slice(0, 500),
        consecutive_failures: (src.consecutive_failures ?? 0) + 1,
      }).eq('id', src.id);
    }
  }

  const status = failed === 0 ? 'success' : ok === 0 ? 'failed' : 'partial';
  await db.from('sourcing_runs').update({
    status, finished_at: new Date().toISOString(), stats: { sources: results, ms: Date.now() - startedAt },
    error: failed ? `${failed} source(s) failed` : null,
  }).eq('id', runId);
  return { status, runId, sources: results };
}

// ── maintain ─────────────────────────────────────────────────────────────
async function runMaintain(db: SupabaseClient, trigger: 'schedule' | 'manual') {
  const { data: runId, error: lockErr } = await db.rpc('start_sourcing_run', { p_job: 'maintain', p_trigger: trigger, p_source_slug: null });
  if (lockErr) throw new Error(lockErr.message);
  if (runId === null) return { status: 'skipped', reason: 'A maintenance run is already in progress.' };

  const stats = { checked: 0, ok: 0, broken: 0, unknown: 0, unpublished_broken_imports: 0, expiry: null as unknown };
  try {
    const { data: rows, error } = await db
      .from('opportunities')
      .select('id, application_url, source_id, link_status')
      .eq('status', 'active')
      .eq('is_published', true)
      .order('link_checked_at', { ascending: true, nullsFirst: true })
      .limit(MAINTAIN_BATCH);
    if (error) throw new Error(error.message);

    const results = await mapLimit(rows ?? [], LINK_CHECK_CONCURRENCY, async (r) => ({ r, link: await checkLink(r.application_url as string) }));
    const now = new Date().toISOString();
    for (const { r, link } of results) {
      stats.checked++;
      stats[link.status]++;
      const update: Record<string, unknown> = { link_status: link.status, link_checked_at: now };
      if (link.status === 'ok') update.last_verified_at = now;
      // Imported listings with a dead link leave public browsing for review;
      // manually added listings are only flagged for the admin.
      if (link.status === 'broken' && r.source_id) {
        update.is_published = false;
        update.status = 'pending_review';
        update.review_reason = `Application link returned HTTP ${link.code}`;
        stats.unpublished_broken_imports++;
      }
      await db.from('opportunities').update(update).eq('id', r.id);
    }

    const { data: expiry, error: expErr } = await db.rpc('archive_expired_opportunities', { p_trigger: trigger });
    if (expErr) throw new Error(expErr.message);
    stats.expiry = expiry;

    await db.from('sourcing_runs').update({ status: 'success', finished_at: new Date().toISOString(), stats }).eq('id', runId);
    return { status: 'success', runId, stats };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.from('sourcing_runs').update({ status: 'failed', finished_at: new Date().toISOString(), stats, error: message }).eq('id', runId);
    throw err;
  }
}

// ── handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server not configured' }, 500);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const trigger = await authorize(req, db);
  if (!trigger) return json({ error: 'Unauthorized' }, 401);

  let body: { job?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body = discover
  }
  const job = body.job === 'maintain' ? 'maintain' : 'discover';
  const onlySlug = typeof body.source === 'string' && /^[a-z0-9-]{2,60}$/.test(body.source) ? body.source : null;

  const work = job === 'maintain' ? runMaintain(db, trigger) : runDiscover(db, trigger, onlySlug);

  // Scheduled calls return immediately and finish in the background.
  if (trigger === 'schedule' && typeof EdgeRuntime !== 'undefined') {
    EdgeRuntime.waitUntil(work.catch((err) => console.error(`[opportunity-sourcing] ${job} failed:`, err)));
    return json({ accepted: true, job }, 202);
  }
  try {
    return json(await work);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Run failed' }, 500);
  }
});
