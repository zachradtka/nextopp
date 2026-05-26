# Switch from SQLite/Turso to Postgres on Neon

We are migrating the database from SQLite/Turso to Postgres hosted on Neon (via the Vercel integration), driven by the need for fast, indexed substring search across `company`, `role`, `jobId`, `location`, and `contactName`. The current implementation in [src/lib/actions/opportunities.ts](../../src/lib/actions/opportunities.ts) is `LIKE '%pattern%'` against a SQLite table with no equivalent index — fine at single-user data sizes today, but a dead end for the search work tracked next (scoped query syntax, faceted filters). Postgres gives us `pg_trgm` GIN indexes that make `ILIKE '%pattern%'` fast against the same query shape — so the SQL barely changes, only the engine and the index plan.

This **supersedes** the prior decision in `CLAUDE.md` to prefer SQLite/Turso "for zero-config local dev." That trade-off was correct when no search work was planned; it stops being correct the moment FTS becomes a requirement. We're trading the zero-config promise (clone, `npm install`, `npm run dev`) for a one-time Docker dependency locally, in exchange for: indexed search, Neon per-PR database branching that mirrors production schema and seed data per preview deploy, and idiomatic Postgres types (`boolean`, `timestamptz`, `date`) instead of the SQLite-isms (`integer` 0/1 for booleans, ISO-string timestamps) the schema currently carries.

## Sub-decisions

- **Host: Neon via the Vercel integration.** Native per-environment env-var wiring; branching gives each PR a real Postgres branch off prod for preview validation, eliminating the shared-preview-DB reseed step. Rejected alternatives: Supabase (carries unused auth/storage features), self-hosted (ops cost not worth it for a side project).
- **Local: Docker Compose.** A `postgres:16` service that `npm run dev` auto-starts. Rejected: PGlite (close to zero-config, but subtle divergences from server Postgres would hide FTS bugs until prod); shared Neon dev branch (breaks airplane-mode dev, requires every contributor to hold cloud credentials).
- **FTS: `pg_trgm` GIN indexes, queries stay `ILIKE '%x%'`.** Matches the current behavior exactly (substring/partial match) but indexed. Rejected for now: `tsvector` generated columns, which give language-aware stemming and ranking — but tokenize job IDs like `R-12345` badly, and the relevance-ranking case has no real motivation at single-user data sizes. Tsvector remains a non-breaking additive change if `jobDescription` search ever becomes a real need.
- **Schema cleanup in the same PR.** Since a one-shot data migration is already happening, we also convert `archived` to `boolean`, all timestamps to `timestamptz`, and date-only fields (`appliedAt`, `respondedAt`, `datePosted`) to `date`. Doing it later would require a second migration with another backfill.
- **Migrations: `drizzle-kit generate` + `migrate` with checked-in SQL files.** Replaces `db:push`. Required because we now have custom DDL the schema-diff path can't express (the `pg_trgm` extension, GIN index types), and because Neon preview branches need migrations applied automatically on creation — which only works if the migration SQL is in the repo.
- **Rollout: big-bang cutover.** One-shot `scripts/migrate-turso-to-neon.ts` script reads from Turso, transforms types, writes to Neon. Cutover is a Vercel env-var swap with the prior Turso DB kept untouched as the rollback path. Rejected: dual-write (massive complexity for a single-user app with no uptime SLA).

## Consequences

- `CLAUDE.md` updated: SQLite-over-Postgres rationale removed; new `docker compose up` step in the quick reference; new env var `DATABASE_URL` replaces `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`.
- `drizzle.config.ts` switches from `dialect: "turso"` / `"sqlite"` to `dialect: "postgresql"`; `src/lib/db/schema.ts` switches from `sqliteTable` to `pgTable`; the libsql client in `src/lib/db/index.ts` is replaced with the Neon serverless driver.
- All `archived === 1` / `archived === 0` call sites become `archived === true` / `archived === false`. All form parsing that read timestamps as strings needs to produce Date objects.
- The CSV import script and seed scripts need updates to the new types.
- A new dev-onboarding step: contributors need Docker. The README/CLAUDE.md must say so explicitly.
- The Turso production DB is kept live, read-only, for a backup window (~1 week) post-cutover, then decommissioned.

## Deferred

- **Scoped-query syntax** (e.g. `company-name:micro`, `status:applied`): UX layer on top of the new search, not a DB concern. Its own design session and issue.
- **Structured location** (a real `state` / `city` / `country` column instead of free-text `location`): a domain change that warrants its own grilling. For now, trigram on `location` makes substring search on it usable.
- **Tsvector for `jobDescription`**: revisit if natural-language search of long descriptions becomes a felt need.
