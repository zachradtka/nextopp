"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import {
  archiveOpportunity,
  deleteOpportunity,
} from "@/lib/actions/opportunities";
import type { Opportunity } from "@/lib/db/schema";
import type { Status } from "@/lib/constants";

interface OpportunityTableProps {
  opportunities: Opportunity[];
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

function ActionsMenu({
  opportunityId,
  router,
}: {
  opportunityId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded-md hover:bg-accent cursor-pointer">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/opportunities/${opportunityId}`)}
        >
          <Eye className="size-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/opportunities/${opportunityId}/edit`)
          }
        >
          <Pencil className="size-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => archiveOpportunity(opportunityId)}
        >
          <Archive className="size-4 mr-2" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => deleteOpportunity(opportunityId)}
        >
          <Trash2 className="size-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileCard({
  opp,
  router,
}: {
  opp: Opportunity;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Top row: Role + Status + Actions */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/opportunities/${opp.id}`}
          className="flex-1 min-w-0"
        >
          <div className="text-[0.9375rem] font-bold text-foreground leading-snug">
            {opp.role}
          </div>
          <div className="text-sm font-medium text-muted-foreground mt-0.5">
            {opp.company}
          </div>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge
            status={opp.status as Status}
            opportunityId={opp.id}
          />
          <ActionsMenu opportunityId={opp.id} router={router} />
        </div>
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

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  const router = useRouter();

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

  return (
    <>
      {/* Mobile: Card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {opportunities.map((opp) => (
          <MobileCard key={opp.id} opp={opp} router={router} />
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-card border rounded-lg">
        <Table>
          <TableHeader className="bg-background">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead>Company & Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="py-4">
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
                <TableCell>
                  <StatusBadge
                    status={opp.status as Status}
                    opportunityId={opp.id}
                  />
                </TableCell>
                <TableCell className="text-sm font-medium text-muted-foreground">
                  {formatDate(opp.appliedAt)}
                </TableCell>
                <TableCell className="text-sm font-medium text-muted-foreground">
                  {formatRelativeDate(opp.updatedAt)}
                </TableCell>
                <TableCell>
                  <ActionsMenu opportunityId={opp.id} router={router} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
