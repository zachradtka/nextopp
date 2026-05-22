import { getOptionalSession, isAuthEnabled } from "@/lib/auth-optional";
import { AppShell } from "@/components/layout/app-shell";
import {
  dashboardFlag,
  insightsFlag,
  settingsFlag,
  alertsFlag,
} from "@/lib/flags";
import type { FeatureFlags } from "@/components/layout/nav-items";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getOptionalSession();

  const flags: FeatureFlags = {
    dashboard: await dashboardFlag(),
    insights: await insightsFlag(),
    settings: await settingsFlag(),
    alerts: await alertsFlag(),
  };

  return (
    <AppShell
      user={session?.user ?? null}
      authEnabled={isAuthEnabled()}
      flags={flags}
    >
      {children}
    </AppShell>
  );
}
