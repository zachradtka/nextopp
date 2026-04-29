"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed: boolean;
}

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={collapsed ? "Theme" : undefined}
        aria-label="Toggle theme"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold tracking-[0.025em] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Palette className="size-5 shrink-0" />
        {!collapsed && <span>Theme</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-[8rem]">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="size-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
