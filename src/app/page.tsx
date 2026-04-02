import Link from "next/link";
import { Suspense } from "react";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <Link href="/opportunities/new">
          <Button>Add Opportunity</Button>
        </Link>
      </div>

      <Suspense>
        <StatusFilter />
      </Suspense>

      <OpportunityTable opportunities={opportunities} />
    </div>
  );
}
