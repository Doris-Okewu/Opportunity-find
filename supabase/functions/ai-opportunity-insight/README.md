# ai-opportunity-insight Edge Function

Optional, user-triggered AI layer on top of the existing deterministic
Opportunity Intelligence. Receives a sanitized snapshot of one opportunity,
the user's onboarding profile, and the already-computed deterministic
match/deadline context; calls Gemini with a strict system prompt and forced
JSON schema output; validates and deadline-corrects the result server-side;
returns a structured `AIOpportunityInsight` or a safe failure. Never returns
raw provider errors, and never accepts or exposes the Gemini API key.

This document contains **no real secret values** — only placeholder
commands to run later, after code review.

## Prerequisites

`supabase link` has been run for this project, and `supabase/config.toml`
now exists with an explicit override for this function:

```toml
[functions.ai-opportunity-insight]
verify_jwt = false
```

**Why `false`, not the platform default of `true`:** this project uses
Supabase's newer `sb_publishable_.../sb_secret_...` key format rather than
legacy JWT-format keys. `supabase-js` always sends the configured
`VITE_SUPABASE_ANON_KEY` as `Authorization: Bearer <key>` on every
`functions.invoke(...)` call (regular app users have no login, so this is
the only credential ever sent). With `verify_jwt = true`, Supabase's
gateway tries to validate that bearer token as a signed JWT — but a
`sb_publishable_...` string isn't a JWT, so the gateway rejects the request
with a 401 before this function's own code ever runs. Because that
rejection happens at the platform layer, outside `index.ts`/`_shared/cors.ts`,
the response is missing CORS headers, so the browser reports it as an
opaque network failure ("Could not reach the AI insight service") rather
than a readable 401. `verify_jwt = false` removes the JWT-format check for
this function specifically; Supabase's gateway still requires a valid
project `apikey` header regardless of this setting, so unrecognized callers
are still rejected — this isn't an open endpoint. The function's real
authorization/safety boundary is its own code (`requestValidation.ts`,
`responseValidation.ts`, the in-memory circuit breaker), which is
unaffected by this setting either way.

## Configuring secrets (placeholders only — do not paste a real key here)

```sh
# Required. Never put this in .env, .env.local, .env.example, VITE_ vars,
# or any frontend/tracked file. This is the only place the key should live.
supabase secrets set GEMINI_API_KEY=YOUR_PRIVATE_KEY

# Optional. Overrides config.ts's DEFAULT_GEMINI_MODEL without a code change.
supabase secrets set GEMINI_MODEL=gemini-2.5-flash

# Optional. Overrides the best-effort per-instance circuit breaker in
# config.ts (see "Known limitation" below).
supabase secrets set AI_INSIGHT_MAX_CALLS_PER_INSTANCE=500
```

Verify secrets are set without ever printing their values:

```sh
supabase secrets list
```

This lists secret **names** only — it does not print values, and you
should never pipe/redirect this to a place a real key could end up logged.

## Deploying

```sh
supabase functions deploy ai-opportunity-insight
```

## Verifying safely after deploy

Test with a throwaway/non-sensitive payload and confirm you get a
structured response back — never paste a real Gemini key into a test
command, and never log the response somewhere that could capture secrets
(there shouldn't be any secrets in the response, but avoid the habit):

```sh
curl -i -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-opportunity-insight' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "clientRequestId": "00000000-0000-4000-8000-000000000000", "opportunity": { ... }, "profile": { ... }, "deterministic": { ... } }'
```

Check the function logs for errors without exposing secrets:

```sh
supabase functions logs ai-opportunity-insight
```

The code in this function never logs the API key or full request/response
bodies (see `geminiProvider.ts` and `index.ts`) — logs only contain short,
generic failure markers (e.g. `"provider call failed (timeout)"`).

## Known limitations (Phase A, by design)

- **Rate limiting is per-instance, in-memory, and resets on cold start.**
  `IN_MEMORY_CIRCUIT_BREAKER_MAX_CALLS` in `config.ts` guards a single warm
  instance against unbounded calls; it is **not** a reliable global daily
  budget across multiple concurrent instances. Reliable enforcement needs a
  small Postgres-backed counter table — proposed below, not applied yet.
- **No persistent cache.** Every request calls Gemini fresh. A cache would
  need the same kind of small table — also proposed below, not applied.
- **The opportunity snapshot is trusted from the client**, not re-fetched
  from Supabase inside the function. Opportunity data is already public
  (RLS allows anon reads of published opportunities) and the AI response is
  never persisted or shared with other users, so a user submitting an
  edited snapshot only affects the insight they themselves receive. Revisit
  if this function ever needs to be defensive against that.

## Proposed future tables (NOT created or migrated in this phase)

```sql
-- Persistent, cross-instance rate limiting.
create table if not exists ai_insight_rate_limit (
  client_ref text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (client_ref, window_start)
);
-- RLS: no public access; only the service role (used solely inside this
-- Edge Function) reads/writes this table.

-- Response caching, keyed by opportunity + the profile dimensions that
-- actually affect the prompt.
create table if not exists ai_insight_cache (
  cache_key text primary key,
  opportunity_id uuid references opportunities(id) on delete cascade,
  payload jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
-- RLS: no public access; only the service role (used solely inside this
-- Edge Function) reads/writes this table.
```

These are proposals for a separate, reviewed migration — not applied by
this change.
