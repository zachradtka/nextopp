import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Markdown } from "@/components/markdown";
import { OpportunitySidebarActions } from "@/components/opportunity-actions";
import { OpportunityTimeline } from "@/components/opportunity-timeline";
import {
  getOpportunity,
  getStatusHistory,
  getComments,
} from "@/lib/actions/opportunities";
import type { Status, WorkMode, EmploymentType, ExperienceLevel } from "@/lib/constants";
import {
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </dt>
      <dd className="text-sm text-foreground font-medium">{children}</dd>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  const [history, comments] = await Promise.all([
    getStatusHistory(id),
    getComments(id),
  ]);

  const locationDisplay = [
    opportunity.workMode
      ? WORK_MODE_LABELS[opportunity.workMode as WorkMode]
      : null,
    opportunity.location,
  ]
    .filter(Boolean)
    .join(" · ");

  const viewPostingLink = opportunity.url ? (
    <a
      href={opportunity.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      <ExternalLink className="size-4" />
      View job posting
    </a>
  ) : null;

  const metadataCard = (
    <div>
      <dl className="space-y-4">
        {locationDisplay && <Field label="Location">{locationDisplay}</Field>}
        {opportunity.department && (
          <Field label="Department">{opportunity.department}</Field>
        )}
        {opportunity.employmentType && (
          <Field label="Employment Type">
            {EMPLOYMENT_TYPE_LABELS[opportunity.employmentType as EmploymentType] ??
              opportunity.employmentType}
          </Field>
        )}
        {opportunity.experienceLevel && (
          <Field label="Experience Level">
            {EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel as ExperienceLevel] ??
              opportunity.experienceLevel}
          </Field>
        )}
        {opportunity.jobId && <Field label="Job ID">{opportunity.jobId}</Field>}
        {(opportunity.salaryMin || opportunity.salaryMax) && (
          <Field label="Salary">
            {opportunity.salaryMin &&
              `$${opportunity.salaryMin.toLocaleString()}`}
            {opportunity.salaryMin && opportunity.salaryMax && " – "}
            {opportunity.salaryMax &&
              `$${opportunity.salaryMax.toLocaleString()}`}
          </Field>
        )}
        {opportunity.contactName && (
          <Field label="Contact">{opportunity.contactName}</Field>
        )}
        {opportunity.datePosted && (
          <Field label="Date Posted">{opportunity.datePosted}</Field>
        )}
        {opportunity.appliedAt && (
          <Field label="Applied">{opportunity.appliedAt}</Field>
        )}
        {opportunity.respondedAt && (
          <Field label="Responded">{opportunity.respondedAt}</Field>
        )}
      </dl>
    </div>
  );

  const sidebarActions = (
    <OpportunitySidebarActions
      id={opportunity.id}
      archived={opportunity.archived === 1}
    />
  );

  const mainContent = (
    <div className="space-y-6">
      {opportunity.jobDescription && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold mb-3">Job Description</h2>
          <Markdown>{opportunity.jobDescription}</Markdown>
        </section>
      )}

      <OpportunityTimeline
        opportunityId={opportunity.id}
        history={history}
        comments={comments}
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Applications
        </Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-foreground font-medium">
          {opportunity.company}
        </span>
      </nav>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{opportunity.company}</h1>
          <p className="text-lg text-muted-foreground">{opportunity.role}</p>
          <div className="pt-1">
            <StatusBadge
              status={opportunity.status as Status}
              opportunityId={opportunity.id}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/opportunities/${opportunity.id}/edit`}>
            <Button>Edit</Button>
          </Link>
          <Link href="/opportunities/new">
            <Button variant="outline">New opportunity</Button>
          </Link>
        </div>
      </div>

      {viewPostingLink && <div className="lg:hidden">{viewPostingLink}</div>}

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">{mainContent}</div>
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          {viewPostingLink}
          {metadataCard}
          {sidebarActions}
        </aside>
      </div>

      <div className="lg:hidden border-t pt-6">{metadataCard}</div>
      <div className="lg:hidden">{sidebarActions}</div>
    </div>
  );
}
