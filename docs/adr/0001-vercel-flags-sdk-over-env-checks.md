# Use the Vercel Flags SDK for feature flags, not raw env-var checks

We gate unbuilt pages (Dashboard, Insights, Settings, Alerts) behind feature flags defined with the Vercel Flags SDK (`flags/next`), each flag using an inline `decide` that reads a `FLAG_*` environment variable. A plain `process.env.FLAG_X === "true"` check would work identically today, since all toggling happens at deploy time for this single-user app — so the SDK looks like overkill at the call sites (`await dashboardFlag()`).

We chose the SDK anyway because it keeps two future doors open with a one-line change per flag: swapping the inline `decide` for an adapter like `@flags-sdk/edge-config` to get runtime toggling without a redeploy, and adding an `identify` function for per-user flag evaluation once multi-user (issue #1) lands. Raw env checks would force a rewrite of every call site to gain either.

## Consequences

- Adds the `flags` dependency.
- Evaluating a flag in a page or layout reads request context, opting that route out of static rendering. Acceptable here — the gated pages are stubs and the `(app)` layout is already dynamic (reads the session).
- Each flag is temporary: when its feature ships, delete the flag, its `notFound()` guard, and its sidebar gate as part of that feature's PR.
