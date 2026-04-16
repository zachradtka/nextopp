import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OpportunityTable } from "@/components/opportunity-table";
import { StatusFilter } from "@/components/status-filter";
import { listOpportunities, getStatusCounts } from "@/lib/actions/opportunities";
import type { Status } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ status?: string; archived?: string; search?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as Status | "all") ?? "all";
  const showArchived = params.archived === "true";
  const search = params.search || undefined;
  const [opportunities, statusCounts] = await Promise.all([
    listOpportunities(statusFilter, showArchived, search),
    getStatusCounts(showArchived, search),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Applications</h1>
          <p className="hidden sm:block text-sm font-medium text-muted-foreground mt-1">
            Track and manage your professional journey through active
            opportunities and historical records.
          </p>
        </div>
        <Link href="/opportunities/new">
          <Button>
            Create
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <StatusFilter current={statusFilter} counts={statusCounts} searchParams={params} />

      {/* Table */}
      <OpportunityTable opportunities={opportunities} />
    </div>
  );
}
