"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const badge = (
    <Badge
      variant="outline"
      className={`${STATUS_COLORS[status]} border-0 cursor-pointer text-[0.75rem] uppercase tracking-wide font-bold`}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );

  if (!interactive) return badge;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => updateOpportunityStatus(opportunityId, s)}
          >
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[s]}`} />
            {STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
