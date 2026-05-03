# Deployment Guide

This project deploys to **Vercel**. Vercel takes care of build, edge caching,
serverless function invocation, cron triggering and HTTPS termination.

## 1. Prerequisites

- A Supabase project (Postgres + Auth + Storage).
- Google AI Studio API key (Gemini).
- (Optional) Cloudflare R2 bucket for media offload.
- (Optional) GitHub Personal Access Token with `contents:write` scope on the
  blog repos you publish to.
- Vercel account connected to the GitHub repository
  `viadorer/orchestrator`.

## 2. Apply database migrations

Migrations live under `supabase/migrations/*.sql` and are applied **in
filename order**. Two ways to apply them:

### Option A — Supabase SQL editor

1. Open Supabase dashboard → SQL → New query.
2. Paste each migration file in numeric order (`001_*.sql`, `002_*.sql`, …).
3. Run.

### Option B — Supabase CLI

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Migrations are written to be **idempotent** (CREATE … IF NOT EXISTS,
defensive `DO $$ … END $$` blocks). Re-running them is safe.

## 3. Apply seed data (optional)

Files under `seeds/*.sql` create individual projects, knowledge bases, RSS
feeds and prompt templates. Apply only the ones you need.

## 4. Configure Vercel environment variables

In Vercel dashboard → Project → Settings → Environment Variables, add the
following for **Production** and **Preview** scopes (Development can be
done locally via `.env.local`).

| Variable | Required | Description |
| --- | :-: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only!) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Gemini API key |
| `CRON_SECRET` | ✅ | Cron auth token (`openssl rand -hex 32`) |
| `GETLATE_API_KEY` | optional | Social publishing |
| `GETLATE_API_URL` | optional | Default `https://api.getlate.dev/v1` |
| `R2_ACCOUNT_ID` etc. | optional | Cloudflare R2 storage |
| `GITHUB_PAT` | optional | Blog + AIO publishing |

> ⚠️ **Never** put secrets in `NEXT_PUBLIC_*` variables — they ship to the
> browser bundle. The validator in `src/lib/env.ts` rejects deploys missing
> required server-side keys.

## 5. Vercel cron

`vercel.json` declares two cron triggers:

```jsonc
{
  "crons": [
    { "path": "/api/cron/agent", "schedule": "0 * * * *" },
    { "path": "/api/cron/rss",   "schedule": "0 */6 * * *" }
  ]
}
```

Vercel attaches an `Authorization: Bearer <CRON_SECRET>` header on these
requests. Both endpoints validate the token via `crypto.timingSafeEqual`
(`src/lib/api/verify-cron.ts`).

> ℹ️ Vercel **Hobby** plan caps function execution at **10 s**. The agent
> cron runs ~10 sequential steps, several of which are AI calls. Production
> deployments should be on **Pro** plan (`maxDuration: 60s`) until the cron
> is split into micro-handlers (see the audit follow-up roadmap).

## 6. Initial smoke test

After the first deploy:

1. Visit `/login`, register an admin account.
2. Open `/cron/status` (requires login) — verifies env, DB connectivity,
   advisory lock health.
3. Trigger `/api/cron/agent` manually via curl with the bearer token to
   confirm the cron pipeline runs end-to-end.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<your-app>.vercel.app/api/cron/agent
```

## 7. Rollback

Vercel keeps every deploy. Roll back via dashboard → Deployments → [previous]
→ "Promote to production".

Database rollbacks must be authored as new migrations — never delete an
applied migration file.

## 8. Production checklist

- [ ] All required env vars set in Vercel.
- [ ] Database migrations applied through `036_usage_ledger.sql`.
- [ ] `CRON_SECRET` is at least 32 random hex chars.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **not** exposed to client (no `NEXT_PUBLIC_` prefix).
- [ ] Cron endpoints return 200 for valid bearer + 401 for invalid.
- [ ] Vercel plan covers max function duration of running cron pipeline.
- [ ] Cloudflare R2 bucket has CORS configured for your Vercel domain.
- [ ] GitHub PAT has the **minimum** scopes: `contents:write` on the
      specific blog repos only.
