# Turso → Neon data migration runbook

One-shot, idempotent copy of every row from the production Turso database to the production Neon database. Backs the cutover tracked in issue #100.

The script lives at [scripts/migrate-turso-to-neon.ts](migrate-turso-to-neon.ts). Transformation logic is unit-tested in [scripts/lib/migrate-transform.test.ts](lib/migrate-transform.test.ts).

## Prerequisites

- Both databases reachable from your laptop:
  - **Source** — Turso prod credentials: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
  - **Target** — Neon prod connection string: `DATABASE_URL`
- Target schema already applied. Run `DATABASE_URL=<neon-prod> npm run db:migrate` first so the 6 tables and `pg_trgm` extension exist. *(In normal Vercel flow this happens automatically as part of the build that runs on each deploy.)*
- A backup of Turso prod (see step 1 below). The script does NOT modify Turso, but having a dump means a rollback is just an env-var swap.

## What the script does

1. Connects to both DBs.
2. Validates that the 6 target tables exist (else exits 1 with a "run `db:migrate` first" message).
3. Reads source row counts for each table — printed up front in both `--dry-run` and real runs.
4. (Real runs only) `TRUNCATE`s all 6 target tables in a single statement with `RESTART IDENTITY` — Postgres requires FK-linked tables to be truncated together.
5. (Real runs only) Reads each table from source, applies the transforms, inserts into target.

**Idempotent:** re-running produces identical target state (truncate then insert).

**Transforms applied:**

| Column(s) | Source (Turso SQLite) | Target (Neon Postgres) |
|---|---|---|
| `opportunities.archived` | integer 0/1 | boolean |
| `users.emailVerified`, `verification_tokens.expires` | integer ms-since-epoch | Date (timestamptz) |
| `*.created_at`, `*.updated_at`, `*.changed_at` | text ISO string | ISO string (timestamptz, `mode: "string"`) |
| `opportunities.applied_at`, `responded_at`, `date_posted` | text YYYY-MM-DD | YYYY-MM-DD string (date, `mode: "string"`) |
| `accounts.expires_at` | integer seconds-since-epoch | integer (unchanged — Auth.js OAuth) |

## Flags

- `--dry-run` — connects to both, validates target schema, prints row counts, performs no writes. Exit 0.
- `--limit N` — copies only the most recent `N` opportunities (sorted by `created_at DESC`), plus the `status_history` and `opportunity_comments` rows that reference those opportunities. Useful for staging the cutover against a small subset. `users`, `accounts`, `verification_tokens` are always copied in full.

## Cutover sequence (for #100)

This is the order to run things on cutover day. Reproduces the cadence from issue #100 with the exact commands for this script.

### 1. Backup Turso

```bash
mkdir -p backups
turso db dump <prod-db-name> > "backups/turso-prod-$(date +%Y%m%d-%H%M).dump"
ls -lh backups/   # confirm non-zero size
```

Keep the dump for at least 1 week before decommissioning Turso.

### 2. Stop using the app for ~15 minutes

Single-user, so this is "don't capture anything for the next 15 min" — no maintenance page needed.

### 3. Dry-run against prod

```bash
TURSO_DATABASE_URL='libsql://<prod-host>' \
TURSO_AUTH_TOKEN='<prod-token>' \
DATABASE_URL='<neon-prod-pooled-url>' \
  npm run migrate-turso-to-neon -- --dry-run
```

Verify row counts look right (compare against what you'd expect from the Turso dashboard).

### 4. Real migration

Same command, drop `--dry-run`:

```bash
TURSO_DATABASE_URL='libsql://<prod-host>' \
TURSO_AUTH_TOKEN='<prod-token>' \
DATABASE_URL='<neon-prod-pooled-url>' \
  npm run migrate-turso-to-neon
```

Capture stdout. Counts in the "inserted" output should match the "Source row counts" output.

### 5. Verify

In the Neon dashboard SQL editor (production branch):

```sql
-- Row counts per table
SELECT 'users' tbl, count(*) FROM users
UNION ALL SELECT 'accounts', count(*) FROM accounts
UNION ALL SELECT 'verification_tokens', count(*) FROM verification_tokens
UNION ALL SELECT 'opportunities', count(*) FROM opportunities
UNION ALL SELECT 'status_history', count(*) FROM status_history
UNION ALL SELECT 'opportunity_comments', count(*) FROM opportunity_comments;

-- Spot-check a few opportunities
SELECT id, company, role, status, archived, applied_at, created_at
FROM opportunities ORDER BY created_at DESC LIMIT 10;

-- Confirm a known-archived row came across as boolean true
SELECT id, archived FROM opportunities WHERE archived = true LIMIT 5;

-- Confirm timestamps look sane
SELECT email, "emailVerified" FROM users WHERE "emailVerified" IS NOT NULL LIMIT 5;
```

### 6. Vercel env-var swap → triggers redeploy

In Vercel **Settings → Environment Variables → Production**:

- Remove `TURSO_DATABASE_URL`
- Remove `TURSO_AUTH_TOKEN`
- Confirm `DATABASE_URL` is set (Vercel-Neon integration injects it)

Trigger a production redeploy. The newly deployed runtime reads from Neon.

> Preview env vars are NOT touched — those stay on Neon branches per #99.

### 7. Smoke-test prod

Walk the same flow the PR's test matrix used: list / capture / manual create / edit / archive / unarchive / status change / search / view timeline / add comment.

### 8. Doc finalization

In a small follow-up commit (or as part of the cutover PR):

- Update CLAUDE.md "Quick Reference" / "Architecture" / "Project Decisions" to remove residual "Turso" mentions (most were already cleaned up in #96, but double-check).
- Update [ADR-0003](../docs/adr/0003-postgres-on-neon-for-full-text-search.md) supersession note: "cutover complete on YYYY-MM-DD".

### 9. Wait 1 week, then decommission Turso

Delete the Turso production DB from the Turso dashboard. Optionally remove the dump from `backups/` if disk pressure matters.

## Rollback

If smoke-testing in step 7 reveals breakage:

1. In Vercel **Settings → Environment Variables → Production**, re-add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. **Note:** the merged code (post-PR #120) does NOT read these any more — see the rollback path below.
2. Revert PR #120 (`git revert <merge-sha>` and push to main) — Vercel auto-deploys the revert, which restores the libsql code path that reads `TURSO_*`.
3. Production is now back on the untouched Turso DB. The Neon data is left in place — re-running this migration script is the path forward when you're ready to retry.

If you reach the 1-week decommission point without rollback, delete the Turso DB and remove the rollback paragraph from this doc.
