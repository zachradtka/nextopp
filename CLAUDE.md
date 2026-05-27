@AGENTS.md

# NextOpp

Job opportunity tracking web app. Open source, single-user (multi-user planned — see issue #1).

## Quick Reference

```bash
npm run dev          # Start dev server (uses local PGlite at ./data/pglite)
npm run build        # Production build
npm run db:generate  # Generate a migration SQL file from schema changes
npm run db:migrate   # Apply pending migrations (PGlite locally, Postgres via DATABASE_URL)
npm run db:studio    # Browse data with Drizzle Studio
npm run import -- <csv> <user-id>  # Import opportunities from CSV
npm run email        # Preview email templates at http://localhost:3001
```

## Architecture

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Database**: Postgres. Local dev uses [PGlite](https://pglite.dev) (file-backed at `./data/pglite`); production/preview uses Postgres on Neon via the Vercel-Neon integration (`DATABASE_URL`). The runtime client in `src/lib/db/index.ts` switches based on `DATABASE_URL`.
- **ORM**: Drizzle — schema in `src/lib/db/schema.ts`, client in `src/lib/db/index.ts`. Migrations live in `drizzle/` and are checked into the repo.
- **Auth**: Auth.js (NextAuth v5) with GitHub, Google, LinkedIn OAuth + email magic link — disabled by default via `AUTH_DISABLED=true`
- **Styling**: Tailwind CSS v4 + shadcn/ui (uses `@base-ui/react`, NOT Radix — no `asChild` prop)
- **Deployment**: Vercel, auto-deploys on push to main

## Key Conventions

- Server Actions for all data mutations (`src/lib/actions/`)
- Status is a text enum defined in `src/lib/constants.ts`, not a DB table — keep it that way
- Work mode (remote/hybrid/onsite) should be separate from location (see issue #1)
- Auth is optional — `AUTH_DISABLED=true` skips auth entirely, no OAuth needed
- `ALLOWED_USERS` env var restricts sign-in to specific GitHub usernames or email addresses (comma-separated)
- Auth providers are configured dynamically — only providers with env vars set appear on the sign-in page
- Email magic link requires `AUTH_RESEND_KEY` (Resend API key) and optionally `AUTH_EMAIL_FROM`
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Drizzle dialect is `postgresql`. Use `db:generate` + `db:migrate` (never `db:push`) so PR-branch Neon DBs get the same SQL the operator's local PGlite gets.
- Timestamps marshal as ISO strings (`mode: "string"` on the schema); auth-adapter columns (`emailVerified`, `expires`) use `mode: "date"` because the Auth.js adapter sends Date objects.
- Feature flags (gating unbuilt pages) are defined in `src/lib/flags.ts` — add new flags there; see `docs/adr/0001-vercel-flags-sdk-over-env-checks.md`

## Project Decisions

- **Single-user for now**: No `userId` on opportunities table. Multi-user support is planned (issue #1) but deferred.
- **Statuses as enums, not a DB table**: Small fixed set, UI needs the metadata in code anyway. Simpler queries, no joins.
- **Postgres everywhere, PGlite for local**: See [ADR-0003](docs/adr/0003-postgres-on-neon-for-full-text-search.md). Production runs Neon Postgres; local dev runs PGlite (a WASM build of Postgres bundled into the app process) at `./data/pglite/`. Zero-config dev — no Docker, no separate DB service. PGlite ships real Postgres extensions (`pg_trgm`, `btree_gin`) compiled to WASM, so behavior matches Neon closely.

## Migrations workflow

1. Edit the schema in `src/lib/db/schema.ts`.
2. Run `npm run db:generate` — Drizzle Kit diffs the schema against the last migration in `drizzle/` and writes a new `NNNN_*.sql` file. Commit it.
3. Run `npm run db:migrate` — applies any pending migrations to your local PGlite at `./data/pglite/`. With `DATABASE_URL` set, it targets that Postgres instead.

The Vercel build runs `npm run db:migrate` against the per-environment `DATABASE_URL` so preview branches and production both pick up new migrations automatically.

## Preview environment

Vercel preview deploys run against a Neon **branch** (a copy-on-write fork of the production Neon DB) with `AUTH_DISABLED=true`. The Vercel-Neon integration provisions one DB branch per PR and injects `DATABASE_URL` into the preview env. Other per-environment vars (`AUTH_DISABLED`, OAuth/`AUTH_SECRET`) are scoped in Vercel **Settings → Environment Variables**.

When `AUTH_DISABLED=true`, the app runs as a single hardcoded user with id `local-dev-user` (see [src/lib/auth-optional.ts](src/lib/auth-optional.ts)). When seeding a preview DB, pass `local-dev-user` as the import script's user-id arg — using a different id leaves opportunities orphaned and the UI shows empty.

```bash
DATABASE_URL=<preview-postgres-url> \
  npm run import -- scripts/sample-data.csv local-dev-user
```

## Email Templates

Magic-link sign-in emails are rendered with [react-email](https://react.email) from [emails/magic-link.tsx](emails/magic-link.tsx) and sent through Resend (override in [src/lib/auth.ts](src/lib/auth.ts)). Iterate visually with `npm run email` (port 3001) — keep `npm run dev` running too so the icon resolves from `http://localhost:3000/email/icon.png`.

The email icon is a PNG generated from the app's SVG favicon. Whenever you change [src/app/icon.svg](src/app/icon.svg), regenerate the email PNG:

```bash
rsvg-convert -w 96 -h 96 src/app/icon.svg -o public/email/icon.png
```

96×96 source, displayed at 48×48 in the template — the 2× resolution keeps it crisp on retina email clients. `rsvg-convert` comes from the `librsvg2-bin` package (`sudo apt install librsvg2-bin`).

## GitHub Issues

Feature backlog is tracked in GitHub Issues: https://github.com/zachradtka/nextopp/issues

## AI Parsing

- URL parsing uses Firecrawl when `FIRECRAWL_API_KEY` is configured
- Pasted-text parsing routes through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) when `AI_GATEWAY_API_KEY` and `AI_MODEL` are set
- Get the gateway API key from the Vercel dashboard. The gateway provides centralized observability (request logs, latency, token usage) for every model call
- Gateway usage is billed through your Vercel account by default; configure BYOK in the Gateway dashboard to bill against your own provider keys instead
- `AI_MODEL` uses the `provider/model` format, e.g. `anthropic/claude-sonnet-4.6`, `openai/gpt-4.1-mini`, `google/gemini-2.5-flash` — switch models by editing this single string
- Optional: set `AI_PARSE_TIMEOUT_MS` to control how long a parse call can run before it fails
- Optional Firecrawl settings:
  - `FIRECRAWL_API_URL` defaults to `https://api.firecrawl.dev/v2`
  - `FIRECRAWL_TIMEOUT_MS` controls the Firecrawl scrape timeout
  - `FIRECRAWL_MAX_AGE_MS` controls Firecrawl caching
  - `FIRECRAWL_PROXY` can be `basic`, `enhanced`, or `auto`
- When neither Firecrawl nor the AI Gateway is configured, the opportunity form renders exactly like the non-AI version

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`zachradtka/nextopp`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, each mapped to its default label name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
