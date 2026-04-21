"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CommentAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
};

interface CommentActionsMenuProps {
  actions: CommentAction[];
  ariaLabel?: string;
}

export function CommentActionsMenu({
  actions,
  ariaLabel = "Comment actions",
}: CommentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onSelect}
              variant={action.destructive ? "destructive" : "default"}
            >
              {Icon && <Icon className="size-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
