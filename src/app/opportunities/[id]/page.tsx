import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { getOpportunity, archiveOpportunity, deleteOpportunity } from "@/lib/actions/opportunities";
import type { Status } from "@/lib/constants";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{opportunity.company}</h1>
          <p className="text-lg text-muted-foreground">{opportunity.role}</p>
        </div>
        <StatusBadge
          status={opportunity.status as Status}
          opportunityId={opportunity.id}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {opportunity.location && (
          <div>
            <span className="font-medium">Location:</span>{" "}
            {opportunity.location}
          </div>
        )}
        {opportunity.url && (
          <div>
            <span className="font-medium">Posting:</span>{" "}
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              View posting
            </a>
          </div>
        )}
        {(opportunity.salaryMin || opportunity.salaryMax) && (
          <div>
            <span className="font-medium">Salary:</span>{" "}
            {opportunity.salaryMin && `$${opportunity.salaryMin.toLocaleString()}`}
            {opportunity.salaryMin && opportunity.salaryMax && " - "}
            {opportunity.salaryMax && `$${opportunity.salaryMax.toLocaleString()}`}
          </div>
        )}
        {opportunity.appliedAt && (
          <div>
            <span className="font-medium">Applied:</span>{" "}
            {opportunity.appliedAt}
          </div>
        )}
        {opportunity.respondedAt && (
          <div>
            <span className="font-medium">Responded:</span>{" "}
            {opportunity.respondedAt}
          </div>
        )}
      </div>

      {opportunity.notes && (
        <div>
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {opportunity.notes}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Link href={`/opportunities/${opportunity.id}/edit`}>
          <Button>Edit</Button>
        </Link>
        <form
          action={async () => {
            "use server";
            await archiveOpportunity(id);
            redirect("/");
          }}
        >
          <Button variant="outline" type="submit">
            Archive
          </Button>
        </form>
        <form
          action={async () => {
            "use server";
            await deleteOpportunity(id);
            redirect("/");
          }}
        >
          <Button variant="destructive" type="submit">
            Delete
          </Button>
        </form>
        <Link href="/" className="ml-auto">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>
    </div>
  );
}
