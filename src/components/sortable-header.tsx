"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { nextSortState } from "@/lib/sort/next-sort-state";
import type { SortColumn, SortState } from "@/lib/sort/types";

interface SortableHeaderProps {
  column: SortColumn;
  currentSort: SortState | null;
  className?: string;
  children: React.ReactNode;
}

export function SortableHeader({
  column,
  currentSort,
  className,
  children,
}: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isActive = currentSort?.column === column;
  const direction = isActive ? currentSort.direction : null;

  function handleClick() {
    const next = nextSortState(currentSort, column);
    const params = new URLSearchParams(searchParams.toString());
    if (next === null) {
      params.delete("sort");
      params.delete("dir");
    } else {
      params.set("sort", next.column);
      params.set("dir", next.direction);
    }
    const query = params.toString();
    router.push(query ? `/opportunities?${query}` : "/opportunities");
  }

  return (
    <TableHead
      className={cn(
        "group cursor-pointer select-none",
        className,
      )}
      onClick={handleClick}
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {direction === "asc" ? (
          <span aria-hidden="true" className="text-foreground">
            ▲
          </span>
        ) : direction === "desc" ? (
          <span aria-hidden="true" className="text-foreground">
            ▼
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="text-muted-foreground/40 opacity-0 group-hover:opacity-100"
          >
            ↕
          </span>
        )}
      </span>
    </TableHead>
  );
}
