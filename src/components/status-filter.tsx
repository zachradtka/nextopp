"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/constants";

const filters: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "All" },
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
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Button
          key={f.value}
          variant={current === f.value ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
}
