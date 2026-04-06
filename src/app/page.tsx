import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityTable } from "@/components/opportunity-table";
import { StatusFilter } from "@/components/status-filter";
import { listOpportunities } from "@/lib/actions/opportunities";
import type { Status } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ status?: string; archived?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as Status | "all") ?? "all";
  const showArchived = params.archived === "true";
  const opportunities = await listOpportunities(statusFilter, showArchived);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#9CA3AF]">
        <span>Portfolio</span>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Applications</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.025em] text-[#111827]">Applications</h1>
          <p className="hidden sm:block text-sm font-medium text-[#4B5563] mt-1">
            Track and manage your professional journey through active
            opportunities and historical records.
          </p>
        </div>
        <Link href="/opportunities/new">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Add Opportunity
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Suspense>
        <StatusFilter />
      </Suspense>

      {/* Table */}
      <OpportunityTable opportunities={opportunities} />
    </div>
  );
}
