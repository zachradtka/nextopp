import { flag } from "flags/next";

/**
 * Feature flags for unbuilt pages — see issue #61 and
 * docs/adr/0001-vercel-flags-sdk-over-env-checks.md.
 *
 * Each flag defaults to `false` and is enabled per-environment by setting
 * the matching `FLAG_*` env var to "true" (`.env.local` for local dev,
 * the Vercel Preview/Production env scopes for deployments).
 *
 * When a feature actually ships, delete its flag here, its `notFound()`
 * guard in the page, and its `flag:` key in nav-items.ts.
 */

export const dashboardFlag = flag<boolean>({
  key: "dashboard",
  defaultValue: false,
  decide: () => process.env.FLAG_DASHBOARD === "true",
});

export const insightsFlag = flag<boolean>({
  key: "insights",
  defaultValue: false,
  decide: () => process.env.FLAG_INSIGHTS === "true",
});

export const settingsFlag = flag<boolean>({
  key: "settings",
  defaultValue: false,
  decide: () => process.env.FLAG_SETTINGS === "true",
});

export const alertsFlag = flag<boolean>({
  key: "alerts",
  defaultValue: false,
  decide: () => process.env.FLAG_ALERTS === "true",
});
