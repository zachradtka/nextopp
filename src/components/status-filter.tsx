"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/constants";

const filters: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

interface StatusFilterProps {
  selected: Status[];
  counts: Record<string, number>;
  searchParams: Record<string, string | undefined>;
}

export function StatusFilter({ selected, counts, searchParams }: StatusFilterProps) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const router = useRouter();
  const isAllActive = selected.length === 0;

  function isActive(value: Status | "all"): boolean {
    return value === "all" ? isAllActive : selected.includes(value);
  }

  function pushWithStatuses(next: Status[]) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val !== undefined && key !== "status") {
        params.set(key, val);
      }
    }
    if (next.length > 0) {
      params.set("status", next.join(","));
    }
    const query = params.toString();
    router.push(query ? `/opportunities?${query}` : `/opportunities`);
  }

  function onChipClick(value: Status | "all") {
    if (value === "all") {
      pushWithStatuses([]);
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    pushWithStatuses(next);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <div className="flex flex-nowrap gap-2">
        {filters.map((f) => {
          const active = isActive(f.value);
          return (
            <Button
              key={f.value}
              variant={active ? "default" : "secondary"}
              size="sm"
              className={`rounded-full shrink-0 font-semibold tracking-[0.025em] ${
                active ? "shadow-md" : "text-muted-foreground"
              }`}
              onClick={() => onChipClick(f.value)}
            >
              {f.label}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted-foreground/10 text-muted-foreground"
                }`}
              >
                {f.value === "all" ? total : (counts[f.value] ?? 0)}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
