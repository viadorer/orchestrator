# ADR 0002 — Cron orchestration & race condition protection

* Status: Accepted (advisory locks)
* Date: 2026-04
* Supersedes: nothing

## Context

The Hugo agent runs as a **single hourly cron** on Vercel which executes
~10 sequential phases (auto-schedule, run pending tasks, publish approved
posts, RSS fetch, media tagging, engagement metrics, dedup embedding,
weekly batch jobs). Two failure modes were observed:

1. **Overlap**: Vercel cold-starts can spawn an overlapping invocation
   while the previous one is still running. Without coordination, the
   second instance generates duplicate posts and bypasses
   `max_posts_per_day`.
2. **Timeout**: Hobby plan kills functions at 10 s. AI calls inside
   `runPendingTasks` and `embedPostsForDedup` can together exceed that.

## Decision

Mitigation 1 — **Postgres advisory locks** (current state):
* `acquireCronLock(name)` calls a Supabase RPC that wraps
  `pg_try_advisory_lock`. Locks are session-scoped and auto-released
  when the DB connection ends, so a crashing function cannot deadlock.
* If a lock cannot be acquired the cron returns `{ skipped: true }` and
  exits within a few ms.
* Migration `034_cron_advisory_lock.sql`.

Mitigation 2 — **Constant-time bearer auth** (current state):
* `verifyCronSecret()` uses `crypto.timingSafeEqual` instead of `===`
  to defend against timing attacks on the token.

Mitigation 3 — **Cron split & queue offload** (planned, not yet in code):
* Each phase becomes its own cron route with an independent schedule.
* Long AI work moves out of the synchronous request path into a queue
  (QStash or Inngest). The cron becomes a *scheduler*, not a *worker*.
* This removes the timeout concern and gives per-phase observability.

## Consequences

Positive:
* No more duplicate posts caused by overlapping cron runs.
* Token comparison no longer leaks through timing channels.

Negative:
* While the pipeline is still monolithic, a single bad phase can starve
  the rest. Phase failures are caught and swallowed but operators only
  see the aggregate result, not which phase actually failed.

## Follow-ups

* Per-phase `agent_log` rows so the dashboard can render a phase-level
  timeline (currently only the aggregate result is stored).
* Migration to QStash/Inngest with idempotent task IDs.
* Self-reported health endpoint that distinguishes "cron disabled" from
  "cron running but skipped because of lock".
