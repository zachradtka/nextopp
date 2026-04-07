@AGENTS.md

# Opportunity Tracker

Job opportunity tracking web app. Open source, single-user (multi-user planned — see issue #1).

## Quick Reference

```bash
npm run dev          # Start dev server (uses local SQLite)
npm run build        # Production build
npm run db:push      # Push schema changes to database
npm run db:studio    # Browse data with Drizzle Studio
npm run import -- <csv>  # Import opportunities from CSV
```

## Architecture

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Database**: SQLite locally (`local.db`), Turso (libSQL) in production — auto-switches via `TURSO_DATABASE_URL` env var
- **ORM**: Drizzle — schema in `src/lib/db/schema.ts`, client in `src/lib/db/index.ts`
- **Auth**: Auth.js (NextAuth v5) with GitHub OAuth — disabled by default via `AUTH_DISABLED=true`
- **Styling**: Tailwind CSS v4 + shadcn/ui (uses `@base-ui/react`, NOT Radix — no `asChild` prop)
- **Deployment**: Vercel, auto-deploys on push to main

## Key Conventions

- Server Actions for all data mutations (`src/lib/actions/`)
- Status is a text enum defined in `src/lib/constants.ts`, not a DB table — keep it that way
- Work mode (remote/hybrid/onsite) should be separate from location (see issue #1)
- Auth is optional — `AUTH_DISABLED=true` skips auth entirely, no GitHub OAuth needed
- `ALLOWED_USERS` env var restricts sign-in to specific GitHub usernames (comma-separated)
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- Drizzle config requires `dialect: "turso"` (not `"sqlite"`) when using `TURSO_DATABASE_URL`

## Project Decisions

- **Single-user for now**: No `userId` on opportunities table. Multi-user support is planned (issue #1) but deferred.
- **Statuses as enums, not a DB table**: Small fixed set, UI needs the metadata in code anyway. Simpler queries, no joins.
- **SQLite/Turso over Postgres**: Zero-config local dev for open-source friendliness — clone, npm install, npm run dev.

## Pushing to Turso

When pushing schema changes to the production database:

```bash
TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run db:push
```

## GitHub Issues

Feature backlog is tracked in GitHub Issues: https://github.com/zachradtka/opportunity-tracker/issues

## AI Parsing

- URL parsing uses Firecrawl when `FIRECRAWL_API_KEY` is configured
- Pasted-text parsing uses the configured AI provider when `AI_PROVIDER` is set to a supported provider and the matching API key is present
- Supported providers today: `openai`, `anthropic`, `google`
- Optional: set `AI_MODEL` to override the default model for the selected provider
- Optional: set `AI_PARSE_TIMEOUT_MS` to control how long a parse call can run before it fails
- Optional: set `AI_PARSER_DEBUG=true` for verbose server logs while debugging parser behavior locally
- Optional Firecrawl settings:
  - `FIRECRAWL_API_URL` defaults to `https://api.firecrawl.dev/v2`
  - `FIRECRAWL_TIMEOUT_MS` controls the Firecrawl scrape timeout
  - `FIRECRAWL_MAX_AGE_MS` controls Firecrawl caching
  - `FIRECRAWL_PROXY` can be `basic`, `enhanced`, or `auto`
- Required keys by provider:
  - `OPENAI_API_KEY` when `AI_PROVIDER=openai`
  - `ANTHROPIC_API_KEY` when `AI_PROVIDER=anthropic`
  - `GOOGLE_GENERATIVE_AI_API_KEY` when `AI_PROVIDER=google`
- When neither Firecrawl nor an AI provider is configured, the opportunity form renders exactly like the non-AI version
