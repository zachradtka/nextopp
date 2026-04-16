"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, Search, Bell, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  onMobileMenuClick: () => void;
}

function UserAvatar({
  user,
}: {
  user: { name?: string | null; image?: string | null };
}) {
  const initials = (user.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? "User"}
        className="size-8 rounded-full"
      />
    );
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
      {initials}
    </div>
  );
}

export function TopBar({ user, onMobileMenuClick }: TopBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(currentSearch);

  // Sync local state when URL param changes externally
  useEffect(() => {
    setValue(currentSearch);
  }, [currentSearch]);

  // Debounced navigation
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      router.push(`/?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, currentSearch, searchParams, router]);

  const clearSearch = useCallback(() => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-1 rounded-md hover:bg-accent"
      >
        <Menu className="size-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-9 pr-9 h-9 rounded-full bg-muted border-0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {value && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-md hover:bg-accent text-muted-foreground">
          <Bell className="size-5" />
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <UserAvatar user={user} />
            <span className="hidden sm:block text-sm font-semibold text-foreground">
              {user.name ?? user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
