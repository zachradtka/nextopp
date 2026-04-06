"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/constants";

const filters: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All Apps" },
  ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/?${params.toString()}`);
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
                : "text-[#4B5563]"
            }`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full shrink-0 gap-1.5 font-semibold tracking-[0.025em] text-[#4B5563]"
        disabled
      >
        <SlidersHorizontal className="size-3.5" />
        More Filters
      </Button>
    </div>
  );
}
