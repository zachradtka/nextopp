import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  getOpportunity,
  getStatusHistory,
  archiveOpportunity,
  deleteOpportunity,
} from "@/lib/actions/opportunities";
import type { Status, WorkMode, EmploymentType, ExperienceLevel } from "@/lib/constants";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [opportunity, history] = await Promise.all([
    getOpportunity(id),
    getStatusHistory(id),
  ]);

  if (!opportunity) {
    notFound();
  }

  const locationDisplay = [
    opportunity.workMode
      ? WORK_MODE_LABELS[opportunity.workMode as WorkMode]
      : null,
    opportunity.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="text-sm text-muted-foreground">
        <span>Portfolio</span>
        <span className="mx-1.5">&rsaquo;</span>
        <Link href="/" className="hover:text-foreground">
          Applications
        </Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-foreground font-medium">
          {opportunity.company}
        </span>
      </nav>

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
        {locationDisplay && (
          <div>
            <span className="font-medium">Location:</span> {locationDisplay}
          </div>
        )}
        {opportunity.department && (
          <div>
            <span className="font-medium">Department:</span>{" "}
            {opportunity.department}
          </div>
        )}
        {opportunity.employmentType && (
          <div>
            <span className="font-medium">Employment Type:</span>{" "}
            {EMPLOYMENT_TYPE_LABELS[opportunity.employmentType as EmploymentType] ?? opportunity.employmentType}
          </div>
        )}
        {opportunity.experienceLevel && (
          <div>
            <span className="font-medium">Experience Level:</span>{" "}
            {EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel as ExperienceLevel] ?? opportunity.experienceLevel}
          </div>
        )}
        {opportunity.jobId && (
          <div>
            <span className="font-medium">Job ID:</span> {opportunity.jobId}
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
            {opportunity.salaryMin &&
              `$${opportunity.salaryMin.toLocaleString()}`}
            {opportunity.salaryMin && opportunity.salaryMax && " - "}
            {opportunity.salaryMax &&
              `$${opportunity.salaryMax.toLocaleString()}`}
          </div>
        )}
        {opportunity.contactName && (
          <div>
            <span className="font-medium">Contact:</span>{" "}
            {opportunity.contactName}
          </div>
        )}
        {opportunity.datePosted && (
          <div>
            <span className="font-medium">Date Posted:</span>{" "}
            {opportunity.datePosted}
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

      {opportunity.jobDescription && (
        <div>
          <h2 className="font-medium mb-2">Job Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {opportunity.jobDescription}
          </p>
        </div>
      )}

      {opportunity.notes && (
        <div>
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {opportunity.notes}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="font-medium mb-3">Status Timeline</h2>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[entry.status as Status] ?? "bg-gray-100 text-gray-800"}`}
                  >
                    {STATUS_LABELS[entry.status as Status] ?? entry.status}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(entry.changedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {entry.note && (
                    <span className="ml-2 text-foreground">{entry.note}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
