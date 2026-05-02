# Contributing

Short guide for making changes to this repo without breaking production.

## Local setup

```bash
npm install
cp .env.example .env.local      # fill in real values
npm run dev                     # http://localhost:3000
```

`.env.local` is gitignored. Never commit secrets.

## Branching

* `main` is the production branch (auto-deploys to Vercel on merge).
* Feature branches: `feat/<scope>` or `fix/<scope>` or `chore/<scope>`.
* No direct pushes to `main`. CI runs typecheck + lint + build on every PR.

## Quality gate

Before pushing:

```bash
npm run typecheck
npm run lint
```

The CI pipeline (`.github/workflows/ci.yml`) runs the same gate on every
push and on every PR. Builds run with stub env vars so they don't need
real secrets to validate.

## Database changes

* Add a new migration file — never edit a previously committed one.
* Filename pattern: `NNN_short_description.sql` (lowercase, snake_case).
* Migrations must be **idempotent**: `IF NOT EXISTS` on tables/indexes,
  defensive `DO $$ … END $$` blocks for column adds.
* Test the migration against a Supabase branch before merging to main.

## API routes

For new routes prefer the helpers under `src/lib/api/`:

* `verifyCronSecret(authHeader)` for cron endpoints.
* `requireAuth()` for user-scoped endpoints.
* `assertOwnsProject(userId, projectId)` to confirm ownership *before*
  service-role mutations.
* `ok(data)` / `badRequest(message)` / etc. for consistent responses.
* `parsePagination(searchParams)` + `buildNextCursor(rows, limit)` for
  paginated lists (no offset pagination).

For new long-running calls also use `trackUsage()` from
`src/lib/ai/cost-tracker.ts` so AI token spend lands in `usage_ledger`.

## Architecture decisions

Significant decisions live under `docs/adr/`. Add a new ADR when:

* Choosing between two non-trivial alternatives (queue vs. cron, RLS vs.
  service-role, …).
* Reversing a previous decision (mark the old ADR as `Superseded by …`).

Format: copy `docs/adr/0001-*.md` as a template.

## Commit messages

Conventional-commit style (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
Body should explain *why*, not *what*. Authorship for shared identity:

```
git commit -c user.name="viadorer" -c user.email="viadorer@users.noreply.github.com" -m "..."
```

## Testing

A vitest suite is on the roadmap (see `docs/adr/0002-*.md` follow-ups).
Until it lands, manual verification covers:

* `npm run dev` + click the affected screens.
* For cron changes: curl with bearer token (see `docs/DEPLOY.md`).
* For DB changes: apply the migration to a Supabase branch first.
