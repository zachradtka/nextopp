"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { Opportunity } from "@/lib/db/schema";
import type { Status } from "@/lib/constants";

interface OpportunityTableProps {
  opportunities: Opportunity[];
}

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Applied</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => (
            <TableRow key={opp.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="hover:underline"
                >
                  {opp.company}
                </Link>
              </TableCell>
              <TableCell>{opp.role}</TableCell>
              <TableCell>
                <StatusBadge
                  status={opp.status as Status}
                  opportunityId={opp.id}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {opp.location ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {opp.appliedAt ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
