// Fetchers for each supported source kind. Each returns RawItem[] and throws
// on transport/format errors so one failing source never affects others.
// Only free, documented/public endpoints are used; listings keep a link back
// to the source where its terms require it.
import { locationOpenToNigeria, decodeEntities } from './normalize.ts';
import type { OpportunityType, RawItem } from './normalize.ts';

export interface SourceConfig {
  slug: string;
  kind: 'remotive' | 'himalayas' | 'jobicy' | 'remoteok' | 'greenhouse' | 'ashby' | 'lever' | 'rss';
  config: Record<string, unknown>;
}

export const USER_AGENT = 'OpportunityFindBot/1.0 (+https://opportunity-find.vercel.app)';
const FETCH_TIMEOUT_MS = 20000;
const MAX_ITEMS_PER_SOURCE = 150;

async function getText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, application/rss+xml, application/xml, text/xml, */*' }, signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error(`Timed out fetching ${new URL(url).hostname}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const text = await getText(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${new URL(url).hostname}`);
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

// ── remote job APIs ──────────────────────────────────────────────────────
async function remotive(cfg: SourceConfig): Promise<RawItem[]> {
  const data = await getJson<{ jobs?: Record<string, unknown>[] }>(str(cfg.config.url) || 'https://remotive.com/api/remote-jobs');
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected Remotive response');
  return data.jobs.slice(0, MAX_ITEMS_PER_SOURCE).map((j) => ({
    kind: 'job',
    externalId: `remotive:${str(j.id)}`,
    title: str(j.title),
    organization: str(j.company_name),
    description: str(j.description),
    applicationUrl: str(j.url), // Remotive terms: link back to Remotive
    sourceUrl: str(j.url),
    locationText: str(j.candidate_required_location),
    openToNigeria: locationOpenToNigeria(str(j.candidate_required_location)),
    remote: true,
    workMode: 'remote',
    tags: [...arr(j.tags), str(j.category)].filter(Boolean),
  }));
}

async function himalayas(cfg: SourceConfig): Promise<RawItem[]> {
  const base = str(cfg.config.url) || 'https://himalayas.app/jobs/api';
  const pages = Math.min(Number(cfg.config.pages) || 3, 10);
  const items: RawItem[] = [];
  for (let p = 0; p < pages; p++) {
    const data = await getJson<{ jobs?: Record<string, unknown>[] }>(`${base}?limit=20&offset=${p * 20}`);
    if (!Array.isArray(data.jobs)) throw new Error('Unexpected Himalayas response');
    for (const j of data.jobs) {
      const restrictions = arr(j.locationRestrictions);
      const loc = restrictions.length === 0 ? 'Worldwide' : restrictions.join(', ');
      items.push({
        kind: 'job',
        externalId: `himalayas:${str(j.guid) || str(j.applicationLink)}`,
        title: str(j.title),
        organization: str(j.companyName),
        description: str(j.description) || str(j.excerpt),
        applicationUrl: str(j.applicationLink),
        sourceUrl: str(j.applicationLink),
        locationText: loc,
        openToNigeria: restrictions.length === 0 ? true : locationOpenToNigeria(loc),
        remote: true,
        workMode: 'remote',
        tags: [...arr(j.categories), ...arr(j.parentCategories)],
        levelHint: arr(j.seniority).join(' '),
      });
    }
    if (data.jobs.length < 20) break;
  }
  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}

async function jobicy(cfg: SourceConfig): Promise<RawItem[]> {
  const data = await getJson<{ jobs?: Record<string, unknown>[] }>(str(cfg.config.url) || 'https://jobicy.com/api/v2/remote-jobs?count=100');
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected Jobicy response');
  return data.jobs.slice(0, MAX_ITEMS_PER_SOURCE).map((j) => ({
    kind: 'job',
    externalId: `jobicy:${str(j.id)}`,
    title: str(j.jobTitle),
    organization: str(j.companyName),
    description: str(j.jobDescription) || str(j.jobExcerpt),
    applicationUrl: str(j.url),
    sourceUrl: str(j.url),
    locationText: str(j.jobGeo),
    openToNigeria: locationOpenToNigeria(str(j.jobGeo)),
    remote: true,
    workMode: 'remote',
    tags: [...arr(j.jobIndustry), ...arr(j.jobType)],
    levelHint: str(j.jobLevel),
  }));
}

async function remoteok(cfg: SourceConfig): Promise<RawItem[]> {
  const data = await getJson<Record<string, unknown>[]>(str(cfg.config.url) || 'https://remoteok.com/api');
  if (!Array.isArray(data)) throw new Error('Unexpected Remote OK response');
  return data
    .filter((j) => j && j.id && j.position)
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((j) => {
      // A blank location means "not stated", never "worldwide" (sends to review).
      const loc = str(j.location).trim();
      return {
        kind: 'job' as const,
        externalId: `remoteok:${str(j.id)}`,
        title: str(j.position),
        organization: str(j.company),
        description: str(j.description),
        applicationUrl: str(j.url), // Remote OK terms: link back to Remote OK
        sourceUrl: str(j.url),
        locationText: loc,
        openToNigeria: locationOpenToNigeria(loc),
        remote: true,
        workMode: 'remote' as const,
        tags: arr(j.tags),
      };
    });
}

// ── official employer boards (ATS public APIs) ───────────────────────────
function workModeFrom(text: string): { remote: boolean; mode: 'remote' | 'onsite' | 'hybrid' } {
  const t = text.toLowerCase();
  if (/hybrid/.test(t)) return { remote: false, mode: 'hybrid' };
  if (/remote/.test(t)) return { remote: true, mode: 'remote' };
  return { remote: false, mode: 'onsite' };
}

async function greenhouse(cfg: SourceConfig): Promise<RawItem[]> {
  const board = str(cfg.config.board);
  if (!/^[a-z0-9-]+$/.test(board)) throw new Error('Invalid Greenhouse board');
  const data = await getJson<{ jobs?: Record<string, unknown>[] }>(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected Greenhouse response');
  return data.jobs.slice(0, MAX_ITEMS_PER_SOURCE).map((j) => {
    const loc = str((j.location as Record<string, unknown> | undefined)?.name);
    const wm = workModeFrom(loc);
    return {
      kind: 'job',
      externalId: `greenhouse:${board}:${str(j.id)}`,
      title: str(j.title),
      organization: str(cfg.config.company) || str(j.company_name),
      description: decodeEntities(str(j.content)), // Greenhouse returns escaped HTML
      applicationUrl: str(j.absolute_url),
      sourceUrl: str(j.absolute_url),
      locationText: loc,
      openToNigeria: locationOpenToNigeria(loc),
      remote: wm.remote,
      workMode: wm.mode,
      tags: [],
      deadline: str(j.application_deadline) || null,
    };
  });
}

async function ashby(cfg: SourceConfig): Promise<RawItem[]> {
  const board = str(cfg.config.board);
  if (!/^[a-zA-Z0-9-]+$/.test(board)) throw new Error('Invalid Ashby board');
  const data = await getJson<{ jobs?: Record<string, unknown>[] }>(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  if (!Array.isArray(data.jobs)) throw new Error('Unexpected Ashby response');
  return data.jobs
    .filter((j) => j.isListed !== false)
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((j) => {
      const secondary = Array.isArray(j.secondaryLocations)
        ? (j.secondaryLocations as Record<string, unknown>[]).map((s) => str(s.location)).filter(Boolean)
        : [];
      const loc = [str(j.location), ...secondary].filter(Boolean).join('; ');
      const wp = str(j.workplaceType).toLowerCase();
      const mode = wp === 'hybrid' ? 'hybrid' : j.isRemote || wp === 'remote' ? 'remote' : 'onsite';
      return {
        kind: 'job' as const,
        externalId: `ashby:${board}:${str(j.id)}`,
        title: str(j.title),
        organization: str(cfg.config.company) || board,
        description: str(j.descriptionHtml) || str(j.descriptionPlain),
        applicationUrl: str(j.jobUrl) || str(j.applyUrl),
        sourceUrl: str(j.jobUrl),
        locationText: loc,
        openToNigeria: locationOpenToNigeria(loc),
        remote: mode === 'remote',
        workMode: mode as 'remote' | 'onsite' | 'hybrid',
        tags: [str(j.department), str(j.team)].filter(Boolean),
      };
    });
}

async function lever(cfg: SourceConfig): Promise<RawItem[]> {
  const board = str(cfg.config.board);
  if (!/^[a-zA-Z0-9-]+$/.test(board)) throw new Error('Invalid Lever board');
  const data = await getJson<Record<string, unknown>[]>(`https://api.lever.co/v0/postings/${board}?mode=json`);
  if (!Array.isArray(data)) throw new Error('Unexpected Lever response');
  return data.slice(0, MAX_ITEMS_PER_SOURCE).map((j) => {
    const cats = (j.categories as Record<string, unknown>) ?? {};
    const loc = [str(cats.location), ...arr(cats.allLocations)].filter(Boolean).join('; ');
    const wp = str(j.workplaceType).toLowerCase();
    const mode = wp === 'hybrid' ? 'hybrid' : wp === 'remote' ? 'remote' : workModeFrom(loc).mode;
    return {
      kind: 'job' as const,
      externalId: `lever:${board}:${str(j.id)}`,
      title: str(j.text),
      organization: str(cfg.config.company) || board,
      description: str(j.descriptionPlain) || str(j.description),
      applicationUrl: str(j.hostedUrl) || str(j.applyUrl),
      sourceUrl: str(j.hostedUrl),
      locationText: loc,
      openToNigeria: locationOpenToNigeria(loc),
      remote: mode === 'remote',
      workMode: mode,
      tags: [str(cats.team), str(cats.department)].filter(Boolean),
    };
  });
}

// ── RSS (aggregator feeds — always sent to admin review) ─────────────────
function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  if (!m) return '';
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();
}

async function rss(cfg: SourceConfig): Promise<RawItem[]> {
  const url = str(cfg.config.url);
  const xml = await getText(url);
  if (!/<rss|<feed/i.test(xml)) throw new Error('Not an RSS feed');
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const host = new URL(url).hostname.replace(/^www\./, '');
  return items.slice(0, MAX_ITEMS_PER_SOURCE).map((it) => {
    const link = decodeEntities(tag(it, 'link'));
    const categories = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) =>
      m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim(),
    );
    return {
      kind: 'feed' as const,
      externalId: `rss:${host}:${decodeEntities(tag(it, 'guid')) || link}`,
      title: tag(it, 'title'),
      organization: str(cfg.config.organization) || host,
      // Only the feed's own summary is stored, never the full article.
      description: tag(it, 'description'),
      applicationUrl: link,
      sourceUrl: link,
      locationText: '',
      openToNigeria: null,
      remote: null,
      workMode: null,
      tags: categories,
      typeHint: (str(cfg.config.default_type) || undefined) as OpportunityType | undefined,
    };
  });
}

export async function fetchSource(cfg: SourceConfig): Promise<RawItem[]> {
  switch (cfg.kind) {
    case 'remotive': return remotive(cfg);
    case 'himalayas': return himalayas(cfg);
    case 'jobicy': return jobicy(cfg);
    case 'remoteok': return remoteok(cfg);
    case 'greenhouse': return greenhouse(cfg);
    case 'ashby': return ashby(cfg);
    case 'lever': return lever(cfg);
    case 'rss': return rss(cfg);
    default: throw new Error(`Unsupported source kind: ${String((cfg as { kind: string }).kind)}`);
  }
}

// ── link verification ────────────────────────────────────────────────────
export type LinkStatus = 'ok' | 'broken' | 'unknown';

/** 2xx/3xx = ok; 404/410 = broken; anything else (403 bot-blocking, 429, timeouts) = unknown. */
export async function checkLink(url: string, timeoutMs = 8000): Promise<{ status: LinkStatus; code: number | null }> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' } });
      try { await res.body?.cancel(); } catch { /* ignore */ }
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let code = await attempt('HEAD');
    if (code === 405 || code === 403 || code === 400 || code === 501) code = await attempt('GET');
    if (code >= 200 && code < 400) return { status: 'ok', code };
    if (code === 404 || code === 410) return { status: 'broken', code };
    return { status: 'unknown', code };
  } catch {
    return { status: 'unknown', code: null };
  }
}

/**
 * Slack for the per-source minimum interval. `last_run_at` is written a few
 * seconds after each cron fire, so without slack the next fire exactly one
 * interval later lands just short and the source silently skips a cycle.
 * Overlap is prevented separately by the run lock in start_sourcing_run().
 */
export const SCHEDULE_TOLERANCE_MS = 10 * 60_000;

export function isSourceDue(lastRunAt: string | null, minIntervalMinutes: number, nowMs = Date.now()): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  if (Number.isNaN(last)) return true;
  return nowMs - last >= minIntervalMinutes * 60_000 - SCHEDULE_TOLERANCE_MS;
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}
