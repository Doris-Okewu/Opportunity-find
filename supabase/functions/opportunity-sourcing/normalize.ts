// Pure, deterministic classification and validation of raw source items.
// No AI and no guessing of facts: deadlines, eligibility and links are only
// ever taken from the source. Category / career path / level are keyword
// classifications and are marked auto_classified.

export type OpportunityType =
  | 'job' | 'internship' | 'scholarship' | 'nysc' | 'fellowship' | 'grant' | 'competition' | 'tech_program';
export type ExperienceLevel = 'student' | 'entry' | 'intermediate' | 'senior';

export interface RawItem {
  externalId: string;
  title: string;
  organization: string;
  description: string; // HTML or text
  applicationUrl: string;
  sourceUrl: string;
  locationText: string;
  /** true = source says open worldwide / to Nigeria; false = restricted elsewhere; null = unknown */
  openToNigeria: boolean | null;
  remote: boolean | null;
  workMode: 'remote' | 'onsite' | 'hybrid' | null;
  tags: string[];
  levelHint?: string;
  typeHint?: OpportunityType;
  deadline?: string | null; // only when the source provides one
  kind: 'job' | 'feed';
}

export interface NormalizedRecord {
  title: string;
  organization: string;
  type: OpportunityType;
  career_tags: string[];
  required_skills: string[];
  experience_level: ExperienceLevel;
  location: string | null;
  remote: boolean;
  work_mode: 'remote' | 'onsite' | 'hybrid' | null;
  country: string | null;
  eligibility: string | null;
  description: string;
  application_url: string;
  source_url: string;
  canonical_url: string;
  deadline: string | null;
  source_external_id: string;
}

export type NormalizeResult =
  | { ok: true; record: NormalizedRecord; reviewReasons: string[] }
  | { ok: false; reason: string };

// ── text helpers ─────────────────────────────────────────────────────────
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+|#39);/gi, (m, e: string) => {
    const k = e.toLowerCase();
    if (k in ENTITIES) return ENTITIES[k];
    if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
    return m;
  });
}

/** Repairs UTF-8 text that a source double-encoded as Latin-1 (e.g. "â" + control chars). */
export function fixMojibake(s: string): string {
  if (!/[Â-ô][\u0080-¿]/.test(s)) return s;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 255) return s;
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|br)\s*>|<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function canonicalUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|ref$|source$|gh_src$|lever-|fbclid|gclid)/i.test(key)) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    let s = u.toString();
    if (s.endsWith('/') && u.pathname !== '/') s = s.slice(0, -1);
    return s;
  } catch {
    return null;
  }
}

// ── career-path classification (slugs from src/features/careerEngine) ────
const CAREER_RULES: [string, RegExp][] = [
  ['fullstack', /\bfull[\s-]?stack\b/],
  ['frontend', /\b(front[\s-]?end|react(\.js)?|vue(\.js)?|angular|next\.js|ui engineer|web developer)\b/],
  ['backend', /\b(back[\s-]?end|node(\.js)?|django|laravel|php|ruby on rails|spring boot|\.net|java developer|api engineer)\b/],
  ['mobile', /\b(mobile|android|ios|flutter|react native|kotlin|swift)\b/],
  ['golang', /\b(golang|go developer|go engineer)\b/],
  ['ai-ml', /\b(machine learning|ml engineer|mlops|deep learning|ai engineer|artificial intelligence|llm|nlp|computer vision)\b/],
  ['data-science', /\b(data scien(ce|tist)|statistician)\b/],
  ['data-engineering', /\b(data engineer(ing)?|etl|data platform|analytics engineer)\b/],
  ['data', /\b(data analy(st|sis|tics)|business intelligence|bi analyst|bi developer|power bi|tableau|analytics manager)\b/],
  ['cybersecurity', /\b(cyber|security (engineer|analyst|architect|operations|researcher)|information security|application security|cloud security|penetration|soc analyst|infosec|appsec|grc analyst|ethical hack)/],
  ['devops', /\b(devops|site reliability|sre\b|platform engineer|infrastructure engineer|kubernetes)\b/],
  ['cloud', /\b(cloud|aws|azure|gcp)\b/],
  ['sysadmin', /\b(system(s)? administrator|sysadmin|linux administrator)\b/],
  ['networking', /\b(network engineer|network administrator|ccna|networking)\b/],
  ['it-support', /\b(it support|help ?desk|service desk|desktop support|technical support|it technician)\b/],
  ['dba', /\b(database administrator|dba\b|database reliability)\b/],
  ['qa', /\b(qa (engineer|analyst|tester|automation)|software (test|quality)|quality assurance (engineer|analyst)|test(ing)? engineer|sdet|test automation)\b/],
  ['product-design', /\bproduct designer\b/],
  ['design', /\b(ui\/ux|ux|ui designer|user experience|user interface|interaction designer|visual designer)\b/],
  ['product', /\b(product manager|product owner|product management|head of product)\b/],
  ['blockchain', /\b(blockchain|solidity|web3|smart contract|crypto engineer)\b/],
  ['technical-writing', /\b(technical writer|technical writing|documentation engineer|developer advocate)\b/],
  ['marketing', /\b(digital marketing|seo|growth marketing|performance marketing|content marketing|social media)\b/],
  ['software-engineering', /\b(software (engineer|developer|engineering)|developer|programmer|engineering intern)\b/],
];

// Roles that are not technology careers even when posted by tech companies.
const NON_TECH_TITLE = /\b(business development|sales|account (executive|manager|director)|recruit(er|ing)|talent acquisition|customer success|legal|counsel|accountant|accounting|finance|payroll|human resources|hr (manager|generalist|business partner)|relationship manager|compliance|security officer|security guard)\b/;

/** Career paths from the TITLE only (source tags proved too noisy). */
export function classifyCareerTags(title: string, _tags: string[] = []): string[] {
  const titleL = ` ${title.toLowerCase()} `;
  if (NON_TECH_TITLE.test(titleL)) return [];
  const found = new Set<string>();
  for (const [slug, re] of CAREER_RULES) if (re.test(titleL)) found.add(slug);
  // A specific engineering path makes the generic one redundant.
  if (found.size > 1) found.delete('software-engineering');
  if (found.has('product-design')) found.delete('design');
  return [...found].slice(0, 4);
}

export function classifyLevel(title: string, hint: string | undefined, type: OpportunityType): { level: ExperienceLevel; inferred: boolean } {
  const t = `${title} ${hint ?? ''}`.toLowerCase();
  if (/\b(intern(ship)?|student|apprentice(ship)?|trainee|industrial training|siwes)\b/.test(t)) return { level: 'student', inferred: false };
  if (/\b(graduate|junior|jr\.?|entry[\s-]?level|associate|early career|entry)\b/.test(t)) return { level: 'entry', inferred: false };
  if (/\b(senior|sr\.?|lead|principal|staff|head of|director|vp|chief|architect|expert)\b/.test(t)) return { level: 'senior', inferred: false };
  if (/\b(mid|mid-level|midweight|intermediate|ii|iii)\b/.test(t)) return { level: 'intermediate', inferred: false };
  if (type === 'scholarship' || type === 'internship') return { level: 'student', inferred: true };
  if (type === 'fellowship' || type === 'tech_program' || type === 'competition') return { level: 'entry', inferred: true };
  return { level: 'intermediate', inferred: true };
}

export function classifyFeedType(title: string, fallback?: OpportunityType): OpportunityType | null {
  const t = title.toLowerCase();
  if (/\bscholarships?\b|fully[\s-]funded|tuition (fee )?waiver|bursar(y|ies)/.test(t)) return 'scholarship';
  if (/\bfellowships?\b/.test(t)) return 'fellowship';
  if (/\binternships?\b|\bintern\b/.test(t)) return 'internship';
  if (/\bgrants?\b|\bfunding\b|\bseed fund\b/.test(t)) return 'grant';
  if (/\bhackathons?\b|\bcompetitions?\b|\bchallenge\b|\bcontest\b/.test(t)) return 'competition';
  if (/\bgraduate (trainee|programme|program)\b|\btrainee programme\b|\bapprenticeships?\b/.test(t)) return 'job';
  if (/\bbootcamp\b|\baccelerator\b|\bincubat|\btraining programme\b|\btraining program\b|\bacademy\b/.test(t)) return 'tech_program';
  return fallback ?? null;
}

const TECH_HINT = /\b(tech|technology|digital|software|coding|code|developer|data|ai\b|artificial intelligence|cyber|stem|computer|ict|engineering|startup|innovation|entrepreneur)/;
const NIGERIA_HINT = /\b(nigeria|nigerian|africa|african|developing countr|international students|worldwide|all countries|global)\b/;

/** Location eligibility for job sources. */
export function locationOpenToNigeria(text: string): boolean | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  if (/\b(nigeria|lagos|abuja|africa|emea|worldwide|anywhere|global)\b/.test(t)) return true;
  if (/^remote$/.test(t)) return null;
  return false;
}

export function detectCountry(text: string): string | null {
  const t = text.toLowerCase();
  if (/\b(nigeria|lagos|abuja|fct|kano|enugu|rivers|port harcourt|ibadan|anambra|bauchi|ekiti|bayelsa|delta|edo|katsina|ondo|gombe)\b/.test(t)) return 'Nigeria';
  if (/\b(worldwide|anywhere|global)\b/.test(t)) return 'Worldwide';
  if (/\bafrica\b/.test(t)) return 'Africa';
  if (/\bemea\b/.test(t)) return 'EMEA';
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────
export function normalize(raw: RawItem, opts: { defaultType?: OpportunityType } = {}): NormalizeResult {
  const title = fixMojibake(decodeEntities(raw.title)).replace(/\s+/g, ' ').trim();
  const organization = fixMojibake(decodeEntities(raw.organization)).replace(/\s+/g, ' ').trim();
  if (title.length < 4) return { ok: false, reason: 'incomplete: missing title' };
  if (!organization) return { ok: false, reason: 'incomplete: missing organisation' };
  // Round-up articles ("Top 10+ Scholarships in Canada…") list many opportunities, not one.
  const isListicle = /^\s*(the\s+)?(top|best)\s+\d+|^\s*\d+\+?\s+(best|top|fully[\s-]funded|international|scholarships|fellowships|grants|jobs|internships|opportunities)\b/i.test(title);
  if (isListicle || /no open role|speculative|general application|talent (pool|community)|share your (details|cv)/i.test(title)) {
    return { ok: false, reason: 'not a specific opportunity' };
  }
  const appUrl = canonicalUrl(raw.applicationUrl) ? raw.applicationUrl.trim() : null;
  const canonical = appUrl ? canonicalUrl(appUrl) : null;
  if (!appUrl || !canonical || !appUrl.startsWith('https://')) return { ok: false, reason: 'incomplete: missing or non-https application link' };

  const description = fixMojibake(htmlToText(raw.description)).slice(0, 4000);
  if (description.length < 40) return { ok: false, reason: 'incomplete: description too short' };

  const reviewReasons: string[] = [];
  let type: OpportunityType;
  let careerTags: string[];

  if (raw.kind === 'job') {
    type = raw.typeHint ?? (/\b(intern(ship)?|industrial training|siwes)\b/i.test(title) ? 'internship' : /\bapprentice/i.test(title) ? 'internship' : 'job');
    careerTags = classifyCareerTags(title, raw.tags);
    if (careerTags.length === 0) return { ok: false, reason: 'not a technology role' };
    if (raw.openToNigeria === false) return { ok: false, reason: 'not open to candidates in Nigeria' };
    // A region named in the title overrides a generic "Worldwide" location.
    if (/\b(latam|latin america|us only|usa only|u\.s\. only|united states|canada|europe only|eu only|uk only|apac|india|brazil|mexico|philippines)\b/i.test(title) && !/\b(nigeria|africa|emea)\b/i.test(title)) {
      return { ok: false, reason: 'not open to candidates in Nigeria' };
    }
    if (raw.openToNigeria === null) reviewReasons.push('Location eligibility for Nigeria not stated by the source');
  } else {
    const t = classifyFeedType(title, opts.defaultType);
    if (!t) return { ok: false, reason: 'not an opportunity category we list' };
    type = t;
    careerTags = classifyCareerTags(title, raw.tags);
    const text = `${title} ${description.slice(0, 1500)}`.toLowerCase();
    // Competitions / grants / programmes must be technology related; scholarships,
    // fellowships and internships are relevant to students regardless of field.
    if (['competition', 'grant', 'tech_program'].includes(type) && careerTags.length === 0 && !TECH_HINT.test(text)) {
      return { ok: false, reason: 'not technology related' };
    }
    if (!NIGERIA_HINT.test(text)) reviewReasons.push('Eligibility for Nigerian applicants not confirmed');
    reviewReasons.push('Third-party summary: confirm details and the official application link');
  }

  const { level } = classifyLevel(title, raw.levelHint, type);
  const skills = [...new Set(raw.tags.map((t) => decodeEntities(t).trim()).filter((t) => t.length >= 2 && t.length <= 30))].slice(0, 8);
  const locationText = decodeEntities(raw.locationText).replace(/\s+/g, ' ').trim();

  let deadline: string | null = null;
  if (raw.deadline) {
    const d = new Date(raw.deadline);
    if (!Number.isNaN(d.getTime())) deadline = d.toISOString();
  }
  if (deadline && new Date(deadline).getTime() < Date.now()) return { ok: false, reason: 'deadline already passed' };

  return {
    ok: true,
    reviewReasons,
    record: {
      title: title.slice(0, 200),
      organization: organization.slice(0, 120),
      type,
      career_tags: careerTags,
      required_skills: skills,
      experience_level: level,
      location: locationText ? locationText.slice(0, 160) : null,
      remote: raw.remote ?? false,
      work_mode: raw.workMode,
      country: detectCountry(locationText),
      eligibility: raw.kind === 'job' && locationText ? `Location: ${locationText.slice(0, 160)}` : null,
      description,
      application_url: appUrl,
      source_url: raw.sourceUrl,
      canonical_url: canonical,
      deadline,
      source_external_id: raw.externalId.slice(0, 200),
    },
  };
}
