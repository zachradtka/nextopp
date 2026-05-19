"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Archive, ArchiveRestore, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import {
  bulkArchive,
  bulkUnarchive,
  bulkUpdateStatus,
} from "@/lib/actions/opportunities";
import type { Opportunity } from "@/lib/db/schema";
import {
  STATUSES,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  type Status,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface OpportunityTableProps {
  opportunities: Opportunity[];
  view: "active" | "archive";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  return formatDate(dateStr);
}

interface MobileCardProps {
  opp: Opportunity;
  selected: boolean;
  onToggle: () => void;
}

function MobileCard({ opp, selected, onToggle }: MobileCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border p-4 transition-colors",
        selected && "bg-primary/5",
      )}
    >
      {/* Top row: Checkbox + Role + Status */}
      <div className="flex items-start gap-3">
        {/* Tap target is larger than the visible checkbox to avoid fat-finger
            mishaps and to keep the card's Link distinct. */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Select ${opp.role} at ${opp.company}`}
          aria-pressed={selected}
          className="-m-2 p-2 shrink-0"
        >
          <Checkbox
            checked={selected}
            // Render-only — the wrapping button owns the tap.
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>
        <Link href={`/opportunities/${opp.id}`} className="flex-1 min-w-0">
          <div className="text-[0.9375rem] font-bold text-foreground leading-snug">
            {opp.role}
          </div>
          <div className="text-sm font-medium text-muted-foreground mt-0.5">
            {opp.company}
          </div>
        </Link>
        <StatusBadge status={opp.status as Status} opportunityId={opp.id} />
      </div>

      {/* Divider */}
      <div className="border-t border-border my-3" />

      {/* Bottom row: Applied date + relative time */}
      <div className="flex items-center justify-between text-[0.8125rem] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span>Applied {formatShortDate(opp.appliedAt)}</span>
        </div>
        <span className="text-muted-foreground">
          {formatRelativeDate(opp.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function formatArchiveCounts(updated: number, unchanged: number): string {
  const parts: string[] = [];
  if (updated > 0) {
    parts.push(
      `Archived ${updated} ${updated === 1 ? "opportunity" : "opportunities"}`,
    );
  }
  if (unchanged > 0) {
    parts.push(`${unchanged} already archived`);
  }
  return parts.join(", ");
}

function formatUnarchiveCounts(updated: number, unchanged: number): string {
  const parts: string[] = [];
  if (updated > 0) {
    parts.push(
      `Unarchived ${updated} ${updated === 1 ? "opportunity" : "opportunities"}`,
    );
  }
  if (unchanged > 0) {
    parts.push(`${unchanged} not archived`);
  }
  return parts.join(", ");
}

function formatStatusCounts(
  updated: number,
  unchanged: number,
  status: Status,
): string {
  const label = STATUS_LABELS[status];
  const parts: string[] = [];
  if (updated > 0) {
    parts.push(`Updated ${updated} to ${label}`);
  }
  if (unchanged > 0) {
    parts.push(`${unchanged} already ${label.toLowerCase()}`);
  }
  return parts.join(", ");
}

export function OpportunityTable({
  opportunities,
  view,
}: OpportunityTableProps) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const shiftPressedRef = useRef(false);
  const searchParams = useSearchParams();
  // Bulk selection is enabled on both views — status change is meaningful in
  // either. The action set in the bar varies by view (Archive button is
  // gated to the Active list).
  const bulkEnabled = true;
  const canArchive = view === "active";
  const canUnarchive = view === "archive";

  // Clear selection whenever the URL search params change (filter chip click,
  // search keystroke, archive-view toggle).
  useEffect(() => {
    setSelection(new Set());
    setLastClickedIndex(null);
  }, [searchParams]);

  // Esc clears selection. Skip when focus is in an input/textarea or inside a
  // dialog — those owners handle Esc themselves.
  useEffect(() => {
    if (selection.size === 0) return;
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        if (target.closest("[role='dialog']")) return;
      }
      setSelection(new Set());
      setLastClickedIndex(null);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selection.size]);

  const allSelected =
    opportunities.length > 0 && selection.size === opportunities.length;
  const someSelected = selection.size > 0 && !allSelected;

  function toggleAll() {
    if (selection.size > 0) {
      setSelection(new Set());
      setLastClickedIndex(null);
    } else {
      setSelection(new Set(opportunities.map((o) => o.id)));
    }
  }

  function toggleRow(index: number, useShift: boolean) {
    const opp = opportunities[index];
    setSelection((prev) => {
      const next = new Set(prev);
      if (useShift && lastClickedIndex !== null && lastClickedIndex !== index) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        // Apply the same target state across the range, derived from the
        // clicked row's resulting state.
        const targetChecked = !prev.has(opp.id);
        for (let i = start; i <= end; i++) {
          const id = opportunities[i].id;
          if (targetChecked) next.add(id);
          else next.delete(id);
        }
      } else {
        if (next.has(opp.id)) next.delete(opp.id);
        else next.add(opp.id);
      }
      return next;
    });
    setLastClickedIndex(index);
  }

  function clearSelection() {
    setSelection(new Set());
    setLastClickedIndex(null);
  }

  function handleBulkArchive() {
    const ids = Array.from(selection);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkArchive(ids);
      clearSelection();

      const summary = formatArchiveCounts(result.updated, result.unchanged);
      if (result.failed > 0) {
        const failedPart = `${result.failed} failed`;
        toast.error(summary ? `${summary}, ${failedPart}` : failedPart);
      } else if (result.updated > 0) {
        toast.success(summary);
      } else if (result.unchanged > 0) {
        toast(summary);
      }
    });
  }

  function handleBulkUnarchive() {
    const ids = Array.from(selection);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkUnarchive(ids);
      clearSelection();

      const summary = formatUnarchiveCounts(result.updated, result.unchanged);
      if (result.failed > 0) {
        const failedPart = `${result.failed} failed`;
        toast.error(summary ? `${summary}, ${failedPart}` : failedPart);
      } else if (result.updated > 0) {
        toast.success(summary);
      } else if (result.unchanged > 0) {
        toast(summary);
      }
    });
  }

  function handleBulkStatusChange(status: Status) {
    const ids = Array.from(selection);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkUpdateStatus(ids, status);
      clearSelection();

      const summary = formatStatusCounts(
        result.updated,
        result.unchanged,
        status,
      );
      if (result.failed > 0) {
        const failedPart = `${result.failed} failed`;
        toast.error(summary ? `${summary}, ${failedPart}` : failedPart);
      } else if (result.updated > 0) {
        toast.success(summary);
      } else if (result.unchanged > 0) {
        toast(summary);
      }
    });
  }

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No opportunities yet.</p>
        <p className="text-sm mt-1">
          <Link href="/opportunities/new" className="text-primary underline">
            Add your first one
          </Link>
        </p>
      </div>
    );
  }

  const bulkBarOpen = bulkEnabled && selection.size > 0;
  const desktopColCount = bulkEnabled ? 5 : 4;

  return (
    <>
      {/* Mobile: Card list */}
      <div
        className={cn(
          "flex flex-col gap-3 md:hidden",
          // Leave space below so the floating bulk bar doesn't cover the
          // last card. Includes safe-area inset for iOS home indicator.
          bulkBarOpen && "pb-[calc(5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {opportunities.map((opp, index) => (
          <MobileCard
            key={opp.id}
            opp={opp}
            selected={selection.has(opp.id)}
            onToggle={() => toggleRow(index, false)}
          />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-card border rounded-lg overflow-clip">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            {bulkBarOpen ? (
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead
                  colSpan={desktopColCount}
                  className="h-10 whitespace-nowrap pl-4 pr-2"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected || someSelected}
                      indeterminate={someSelected}
                      onCheckedChange={() => toggleAll()}
                      aria-label={
                        allSelected ? "Deselect all" : "Select all visible"
                      }
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {selection.size} selected
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Select
                        key={selection.size}
                        onValueChange={(value) =>
                          handleBulkStatusChange(value as Status)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label="Change status"
                          className="w-[170px]"
                        >
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`}
                                />
                                {STATUS_LABELS[s]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {canArchive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkArchive}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Archive />
                          )}
                          Archive
                        </Button>
                      )}
                      {canUnarchive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkUnarchive}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <ArchiveRestore />
                          )}
                          Unarchive
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        disabled={isPending}
                      >
                        <X />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </TableHead>
              </TableRow>
            ) : (
              <TableRow className="hover:bg-transparent border-b border-border">
                {bulkEnabled && (
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={false}
                      onCheckedChange={() => toggleAll()}
                      aria-label="Select all visible"
                    />
                  </TableHead>
                )}
                <TableHead className="w-full pl-4">Company &amp; Role</TableHead>
                <TableHead className="min-w-[200px]">Status</TableHead>
                <TableHead className="min-w-[180px]">Applied Date</TableHead>
                <TableHead className="min-w-[180px]">Last Contact</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {opportunities.map((opp, index) => {
              const selected = selection.has(opp.id);
              return (
                <TableRow
                  key={opp.id}
                  data-state={selected ? "selected" : undefined}
                  className={
                    selected
                      ? "bg-primary/5 hover:bg-primary/10 data-[state=selected]:bg-primary/5"
                      : undefined
                  }
                >
                  {bulkEnabled && (
                    <TableCell className="w-10 pl-4">
                      <Checkbox
                        checked={selected}
                        onMouseDown={(e: React.MouseEvent) => {
                          // Suppress the browser's native shift-click text
                          // selection so range select doesn't paint the rows.
                          if (e.shiftKey) e.preventDefault();
                        }}
                        onClick={(e: React.MouseEvent) => {
                          shiftPressedRef.current = e.shiftKey;
                        }}
                        onCheckedChange={() =>
                          toggleRow(index, shiftPressedRef.current)
                        }
                        aria-label={`Select ${opp.role} at ${opp.company}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="w-full py-4 pl-4">
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="hover:underline"
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {opp.company}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {opp.role}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <StatusBadge
                      status={opp.status as Status}
                      opportunityId={opp.id}
                    />
                  </TableCell>
                  <TableCell className="min-w-[180px] text-sm font-medium text-muted-foreground">
                    {formatDate(opp.appliedAt)}
                  </TableCell>
                  <TableCell className="min-w-[180px] text-sm font-medium text-muted-foreground">
                    {formatRelativeDate(opp.updatedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Floating bottom action bar */}
      {bulkBarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg md:hidden"
          role="toolbar"
          aria-label="Bulk actions"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearSelection}
              disabled={isPending}
              aria-label="Cancel selection"
            >
              <X />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              {selection.size}
            </span>
            <Select
              key={selection.size}
              onValueChange={(value) =>
                handleBulkStatusChange(value as Status)
              }
              disabled={isPending}
            >
              <SelectTrigger
                size="sm"
                aria-label="Change status"
                className="ml-auto"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT_COLORS[s]}`}
                      />
                      {STATUS_LABELS[s]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Archive />
                )}
                Archive
              </Button>
            )}
            {canUnarchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnarchive}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ArchiveRestore />
                )}
                Unarchive
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
