"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSortParams } from "@/lib/sort/parse-sort-params";
import {
  DEFAULT_SORT_COLUMN,
  SORT_COLUMN_LABELS,
  SORT_NATURAL_DESCRIPTORS,
} from "@/lib/sort/labels";
import { SORT_COLUMNS, type SortColumn } from "@/lib/sort/types";

export function MobileSortSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentSort = parseSortParams({
    sort: searchParams.get("sort") ?? undefined,
    dir: searchParams.get("dir") ?? undefined,
  });
  const activeColumn: SortColumn = currentSort?.column ?? DEFAULT_SORT_COLUMN;

  function applyColumn(column: SortColumn) {
    if (column === activeColumn) {
      setOpen(false);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (column === DEFAULT_SORT_COLUMN) {
      params.delete("sort");
      params.delete("dir");
    } else {
      params.set("sort", column);
      params.delete("dir");
    }
    const query = params.toString();
    router.push(query ? `/opportunities?${query}` : "/opportunities");
    setOpen(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80"
        aria-label={`Sort: ${SORT_COLUMN_LABELS[activeColumn]}`}
      >
        <span className="text-muted-foreground">Sort:</span>
        <span>{SORT_COLUMN_LABELS[activeColumn]}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 isolate z-50 bg-black/40 duration-150",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-1 rounded-t-2xl bg-popover p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none duration-150",
            "data-open:animate-in data-open:slide-in-from-bottom",
            "data-closed:animate-out data-closed:slide-out-to-bottom",
          )}
        >
          <DialogPrimitive.Title className="px-3 pt-1 pb-2 text-sm font-semibold text-muted-foreground">
            Sort by
          </DialogPrimitive.Title>
          <ul className="flex flex-col">
            {SORT_COLUMNS.map((column) => {
              const isActive = column === activeColumn;
              return (
                <li key={column}>
                  <button
                    type="button"
                    onClick={() => applyColumn(column)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[0.9375rem] font-medium",
                      isActive
                        ? "bg-primary/5 text-foreground"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="flex-1">
                      {SORT_COLUMN_LABELS[column]}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        — {SORT_NATURAL_DESCRIPTORS[column]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
