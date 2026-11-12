// Rule tests for the sourcing normaliser. Run: npm run test:sourcing
// (plain Node with type stripping; no Deno or test framework needed).
import assert from 'node:assert/strict';
import { isSourceDue } from './sources.ts';
import { normalize, canonicalUrl, locationOpenToNigeria } from './normalize.ts';
const desc = 'A real role with a long enough description to pass the minimum length check easily.';
const base = { kind: 'job' as const, externalId: 'x:1', title: 'Software Engineer', organization: 'Acme', description: desc,
  applicationUrl: 'https://acme.com/jobs/1?utm_source=x', sourceUrl: 'https://acme.com/jobs/1', locationText: 'Worldwide',
  openToNigeria: true, remote: true, workMode: 'remote' as const, tags: [] };
let n = 0; const t = (name: string, fn: () => void) => { fn(); n++; console.log('ok -', name); };
t('verified worldwide tech job: ok, no review reasons', () => { const r = normalize(base); assert.ok(r.ok); assert.deepEqual(r.reviewReasons, []); assert.equal(r.record.canonical_url, 'https://acme.com/jobs/1'); });
t('blank location (Remote OK fix) -> review, not worldwide', () => { const r = normalize({ ...base, locationText: '', openToNigeria: locationOpenToNigeria('') }); assert.ok(r.ok); assert.ok(r.reviewReasons.some((x) => /eligibility/i.test(x))); assert.equal(r.record.location, null); assert.equal(r.record.country, null); });
t('"Remote" alone -> review', () => { assert.equal(locationOpenToNigeria('Remote'), null); });
t('US-only location -> rejected', () => { const r = normalize({ ...base, locationText: 'Boston', openToNigeria: locationOpenToNigeria('Boston') }); assert.ok(!r.ok); });
t('region in title overrides Worldwide', () => { const r = normalize({ ...base, title: 'Senior Software Engineer LATAM' }); assert.ok(!r.ok); });
t('non-tech role rejected', () => { assert.ok(!normalize({ ...base, title: 'Account Executive' }).ok); });
t('non-https link rejected', () => { assert.ok(!normalize({ ...base, applicationUrl: 'http://acme.com/j' }).ok); });
t('past deadline rejected', () => { assert.ok(!normalize({ ...base, deadline: '2020-01-01' }).ok); });
t('future deadline kept from source only', () => { const r = normalize({ ...base, deadline: '2099-01-01' }); assert.ok(r.ok); assert.ok(r.record.deadline?.startsWith('2099')); assert.equal(normalize(base).ok && (normalize(base) as any).record.deadline, null); });
t('short description rejected', () => { assert.ok(!normalize({ ...base, description: 'too short' }).ok); });
const feed = { ...base, kind: 'feed' as const, openToNigeria: null, remote: null, workMode: null, locationText: '' };
for (const title of ['Top 10 Scholarships in France for Foreign Students', 'Top 10+ International Scholarships for Women', '15 Fully Funded Scholarships for Africans', 'The Top 20 Fellowships of 2027']) {
  t(`listicle rejected: ${title}`, () => { assert.ok(!normalize({ ...feed, title }).ok); });
}
t('specific scholarship kept but always reviewed', () => { const r = normalize({ ...feed, title: 'NNPC/TotalEnergies National Merit Scholarship 2027 for Nigerian students' }); assert.ok(r.ok); assert.equal(r.record.type, 'scholarship'); assert.ok(r.reviewReasons.length > 0); });
t('canonicalUrl strips tracking + www', () => { assert.equal(canonicalUrl('https://www.X.com/a/?utm_medium=e&b=1#h'), 'https://x.com/a/?b=1'); });
// ── scheduling: cron fires at :15 every 3h; last_run_at is written a little late ──
const simulateDay = (intervalMin: number, lagMs: number) => {
  const day0 = Date.UTC(2026, 10, 13, 0, 15);
  let last: string | null = null;
  const runs: number[] = [];
  for (let h = 0; h < 24; h += 3) {
    const fire = day0 + h * 3_600_000;
    if (isSourceDue(last, intervalMin, fire + 1_000)) {
      runs.push(fire);
      last = new Date(fire + lagMs).toISOString();
    }
  }
  return runs;
};
t('180-min source runs on all 8 daily cron fires despite write lag', () => {
  assert.equal(simulateDay(180, 20_000).length, 8);
  assert.equal(simulateDay(180, 120_000).length, 8);
});
t('360-min source runs every 6h (4/day), not every 9h', () => { assert.equal(simulateDay(360, 20_000).length, 4); });
t('never runs twice within one interval (gap >= interval - 10 min)', () => {
  for (const iv of [180, 360]) {
    const r = simulateDay(iv, 20_000);
    for (let i = 1; i < r.length; i++) assert.ok(r[i] - r[i - 1] >= (iv - 10) * 60_000);
  }
});
t('not due shortly after a run; due at the next cron fire', () => {
  const last = '2026-11-13T00:15:20Z';
  assert.equal(isSourceDue(last, 180, Date.parse('2026-11-13T00:16:00Z')), false);
  assert.equal(isSourceDue(last, 180, Date.parse('2026-11-13T03:05:00Z')), false); // 169m40s < 170m
  assert.equal(isSourceDue(last, 180, Date.parse('2026-11-13T03:15:01Z')), true);
  assert.equal(isSourceDue(null, 180), true);
  assert.equal(isSourceDue('garbage', 180), true);
});
console.log(`\n${n} passed`);
