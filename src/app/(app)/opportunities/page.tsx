import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OpportunityTable } from "@/components/opportunity-table";
import { StatusFilter } from "@/components/status-filter";
import { listOpportunities, getStatusCounts } from "@/lib/actions/opportunities";
import { STATUSES, type Status } from "@/lib/constants";
import { parseSortParams } from "@/lib/sort/parse-sort-params";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    archived?: string;
    search?: string;
    sort?: string;
    dir?: string;
  }>;
}

function parseStatusParam(raw: string | undefined): Status[] {
  if (!raw) return [];
  const valid = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Status => (STATUSES as readonly string[]).includes(s));
  return Array.from(new Set(valid));
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = parseStatusParam(params.status);
  const showArchived = params.archived === "true";
  const search = params.search || undefined;
  const sort = parseSortParams({ sort: params.sort, dir: params.dir });
  const [opportunities, statusCounts] = await Promise.all([
    listOpportunities(statusFilter, showArchived, search, sort),
    getStatusCounts(showArchived, search),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-foreground">Opportunities</h1>
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
      <StatusFilter selected={statusFilter} counts={statusCounts} searchParams={params} />

      {/* Table */}
      <OpportunityTable
        opportunities={opportunities}
        view={showArchived ? "archive" : "active"}
      />
    </div>
  );
}
