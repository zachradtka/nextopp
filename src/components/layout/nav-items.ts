import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Bell,
  Archive,
  Settings,
} from "lucide-react";

/** Feature flags that gate an unbuilt page — see src/lib/flags.ts. */
export type FeatureFlag = "dashboard" | "insights" | "settings" | "alerts";

/** Evaluated flag values, as forwarded from the (app) layout. */
export type FeatureFlags = Record<FeatureFlag, boolean>;

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** When set, the item is shown only if the matching flag is enabled. */
  flag?: FeatureFlag;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, flag: "dashboard" },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/insights", label: "Insights", icon: BarChart3, flag: "insights" },
  { href: "/alerts", label: "Alerts", icon: Bell, flag: "alerts" },
  { href: "/opportunities?archived=true", label: "Archive", icon: Archive },
];

export const bottomItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, flag: "settings" },
];

/**
 * Drop nav items whose feature flag is off. Items without a `flag` (e.g.
 * Opportunities, Archive) are always kept.
 */
export function filterNavItems(items: NavItem[], flags: FeatureFlags): NavItem[] {
  return items.filter((item) => !item.flag || flags[item.flag]);
}
