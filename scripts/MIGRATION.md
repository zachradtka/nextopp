# Turso → Neon data migration runbook

One-shot, idempotent copy of every row from the production Turso database to the production Neon database. Backs the cutover tracked in issue #100.

The script lives at [scripts/migrate-turso-to-neon.ts](migrate-turso-to-neon.ts). Transformation logic is unit-tested in [scripts/lib/migrate-transform.test.ts](lib/migrate-transform.test.ts).

> **Status — cutover completed 2026-05-28 (PR #120, see #100).** Production runs on Neon. Merging PR #120 was itself the cutover (Vercel auto-deploy), so the "trigger a redeploy" framing in step 6 is historical. `TURSO_*` env vars have been removed from Vercel production. The Turso DB is retained as a rollback target until decommissioned — see #121. The steps below are kept as the execution record.

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

Requires a logged-in CLI session. On WSL2 the normal `turso auth login` fails to open a browser (DBus/UPower/GPU errors) — use `turso auth login --headless`, open the printed URL in your Windows browser, and paste the token back.

```bash
mkdir -p backups
turso db export <prod-db-name> --output-file "backups/turso-prod-$(date +%Y%m%d-%H%M).db"
ls -lh backups/   # confirm non-zero size (writes <name>.db + <name>.db-wal)
```

`turso db export` writes a native SQLite file (plus a `.db-wal` sidecar), not a SQL text dump — open it with `sqlite3` or restore via `turso db import` if ever needed. Keep the export for at least 1 week before decommissioning Turso.

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

- Remove `TURSO_DATABASE_URL` — *done during #100 finalization*
- Remove `TURSO_AUTH_TOKEN` — *done during #100 finalization*
- Confirm `DATABASE_URL` is set (Vercel-Neon integration injects it)

The actual cutover happened when PR #120 merged (Vercel auto-deploy), not via this env swap — removing the inert `TURSO_*` vars is hygiene, not the cutover trigger. The runtime already reads from Neon.

> Preview env vars are NOT touched — those stay on Neon branches per #99.

### 7. Smoke-test prod

Walk the same flow the PR's test matrix used: list / capture / manual create / edit / archive / unarchive / status change / search / view timeline / add comment.

### 8. Doc finalization

In a small follow-up commit (or as part of the cutover PR):

- Update CLAUDE.md "Quick Reference" / "Architecture" / "Project Decisions" to remove residual "Turso" mentions (most were already cleaned up in #96, but double-check).
- Update [ADR-0003](../docs/adr/0003-postgres-on-neon-for-full-text-search.md) supersession note: "cutover complete on YYYY-MM-DD".

### 9. Wait 1 week, then decommission Turso

Tracked separately in **#121** (do not start before ~2026-06-04). Deletes the Turso prod DB, archives the local export, removes the now-dead migration script + `@libsql/client`, and retires this runbook.

## Rollback

If smoke-testing in step 7 reveals breakage:

1. In Vercel **Settings → Environment Variables → Production**, re-add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from your saved credentials. **Note:** these were removed during #100 finalization, and the merged code (post-PR #120) does NOT read them anyway — they're only needed once the revert below restores the libsql code path.
2. Revert PR #120 (`git revert <merge-sha>` and push to main) — Vercel auto-deploys the revert, which restores the libsql code path that reads `TURSO_*`.
3. Production is now back on the untouched Turso DB. The Neon data is left in place — re-running this migration script is the path forward when you're ready to retry.

Once #121 closes (Turso decommissioned), this rollback path is gone for good.
