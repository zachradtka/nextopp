"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, STATUS_LABELS, STATUS_COLORS, type Status } from "@/lib/constants";
import { updateOpportunityStatus } from "@/lib/actions/opportunities";

interface StatusBadgeProps {
  status: Status;
  opportunityId: string;
  interactive?: boolean;
}

export function StatusBadge({
  status,
  opportunityId,
  interactive = true,
}: StatusBadgeProps) {
  if (!interactive) {
    return (
      <Badge
        variant="outline"
        className={`${STATUS_COLORS[status]} border-0 text-[0.75rem] uppercase tracking-wide font-bold`}
      >
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Select
      value={status}
      onValueChange={(value) => updateOpportunityStatus(opportunityId, value as Status)}
    >
      <SelectTrigger className="w-40">
        <SelectValue>
          <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
          {STATUS_LABELS[status]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
