"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { FeatureFlags } from "./nav-items";

interface AppShellProps {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  authEnabled: boolean;
  flags: FeatureFlags;
}

export function AppShell({ children, user, authEnabled, flags }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Suspense fallback={<aside className="hidden md:block w-64 shrink-0 border-r" />}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          authEnabled={authEnabled}
          flags={flags}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      </Suspense>
      <div className="flex flex-1 flex-col min-w-0">
        <Suspense fallback={<div className="h-14 shrink-0 border-b" />}>
          <TopBar
            user={user}
            showAlerts={flags.alerts}
            onMobileMenuClick={() => setMobileOpen(true)}
          />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
