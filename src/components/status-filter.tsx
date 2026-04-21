"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/constants";

const filters: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

interface StatusFilterProps {
  current: string;
  counts: Record<string, number>;
  searchParams: Record<string, string | undefined>;
}

export function StatusFilter({ current, counts, searchParams }: StatusFilterProps) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const router = useRouter();

  function setFilter(value: string) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val !== undefined && key !== "status") {
        params.set(key, val);
      }
    }
    if (value !== "all") {
      params.set("status", value);
    }
    router.push(`/opportunities?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <div className="flex flex-nowrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={current === f.value ? "default" : "secondary"}
            size="sm"
            className={`rounded-full shrink-0 font-semibold tracking-[0.025em] ${
              current === f.value
                ? "shadow-md"
                : "text-muted-foreground"
            }`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                current === f.value
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/10 text-muted-foreground"
              }`}
            >
              {f.value === "all" ? total : (counts[f.value] ?? 0)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
