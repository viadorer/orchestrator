# Troubleshooting

Common failure modes and what to check first. Add to this file when you
diagnose a new class of problem.

## Cron is silent — `agent_log` shows no `cron_agent` rows

1. Verify Vercel cron trigger:
   `Vercel dashboard → Project → Cron Jobs` should list both jobs as **Active**.
2. Curl the endpoint manually:
   ```bash
   curl -i -H "Authorization: Bearer $CRON_SECRET" \
        https://<app>.vercel.app/api/cron/agent
   ```
   - 401 → `CRON_SECRET` mismatch between Vercel env and local.
   - 200 with `skipped: true` → previous run holds the advisory lock; check
     `acquireCronLock` in `src/lib/api/cron-lock.ts`.
   - 504 (timeout) → split the pipeline. Hobby plan caps at 10 s.
3. Tail Vercel function logs (`vercel logs <deployment>`) for the cron
   route during the trigger window.

## Cron times out

Symptom: cron returns 504 or Vercel kills the function midway through. The
agent does ~10 sequential steps; the slow ones are AI calls inside
`runPendingTasks` and `embedPostsForDedup`.

Quick fixes:
- Upgrade Vercel plan (Pro → 60 s, Enterprise → 900 s).
- Lower `processUntaggedMedia(N)` and `embedPostsForDedup(N)` budgets.

Real fix (planned): split into micro-handlers (`/api/cron/publish`,
`/api/cron/embed`, …) each with its own schedule, and offload AI work to
QStash / Inngest queues.

## "Supabase not configured" 500s

`supabase` client returns `null` when env vars are missing. Check:
1. Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` set in **Production** scope.
2. Project re-deployed after env change (Vercel does NOT hot-reload env).

`assertEnv()` in `src/lib/env.ts` will throw on startup with a list of
missing keys — wire it into a route or middleware to surface this earlier.

## Image generation always falls back to template card

The visual pipeline is `media match → Imagen → @vercel/og card → QuickChart`.
Falling back means earlier tiers are failing silently. Check:
- `process_untagged_media` cron (Gemini Vision) — without embeddings the
  pgvector match never fires.
- Imagen quota — Gemini API logs in Google Cloud Console.
- `media_assets.embedding` column null-rate — should be < 5 %.

## getLate publishing fails with 4xx

- 401: `GETLATE_API_KEY` rotated and not updated in Vercel.
- 422: Platform-specific constraints (caption length, media count). See
  cookbooks under `docs/*_COOKBOOK.md`.
- Timeout: getLate sometimes pulls our media URLs externally — they MUST
  be publicly reachable. Check that R2 public URL is correct and not
  signed-only.

## "Bearer token not provided" on cron

Vercel sends the bearer header automatically only on cron-triggered runs.
If you curl the endpoint without `-H "Authorization: Bearer $CRON_SECRET"`
you'll get 401. That's expected.

## Build fails on Vercel with type errors

Run locally first:
```bash
npm run typecheck
```
CI on `main` runs `typecheck → lint → build` so PRs that fail typecheck
never merge. If a Vercel build still fails after a green PR, check that
the lockfile (`package-lock.json`) was committed — `npm ci` is strict
about it.

## A user uploaded a 200 MB file and the API 413'd

Limit is hardcoded to 100 MB in `src/app/api/media/upload/route.ts`. If
you raise it, also raise:
- `body-size-limit` on the Next App Router (see `next.config.ts`).
- Cloudflare R2 / Supabase storage upload limits on the bucket.
- Vercel plan max body size (Pro is 4.5 MB by default for non-streamed
  bodies — use the presigned upload route `/api/media/presign` for large
  files).
