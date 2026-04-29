"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Archive,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/opportunities?archived=true", label: "Archive", icon: Archive },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  authEnabled: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function isActive(pathname: string, archived: boolean, href: string) {
  if (href === "/opportunities") {
    return pathname === "/opportunities" && !archived;
  }
  if (href === "/opportunities?archived=true") {
    return pathname === "/opportunities" && archived;
  }
  return pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-semibold tracking-[0.025em] transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-sidebar-primary" />
      )}
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
  authEnabled,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const archived = searchParams.get("archived") === "true";

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/opportunities" className="flex items-center gap-3" onClick={onMobileClose}>
          <Briefcase className="size-6 shrink-0 text-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                Opportunity Tracker
              </span>
            </div>
          )}
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="ml-auto md:hidden p-1 rounded-md hover:bg-sidebar-accent"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, archived, item.href)}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
        ))}
        {authEnabled && (
          <form action={signOutAction}>
            <button
              type="submit"
              title={collapsed ? "Logout" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold tracking-[0.025em] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="size-5 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </form>
        )}

        <ThemeToggle collapsed={collapsed} />

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold tracking-[0.025em] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground justify-center md:justify-start"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block shrink-0 border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
