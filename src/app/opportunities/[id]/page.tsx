import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Markdown } from "@/components/markdown";
import { OpportunityActions } from "@/components/opportunity-actions";
import {
  getOpportunity,
  getStatusHistory,
} from "@/lib/actions/opportunities";
import type { Status, WorkMode, EmploymentType, ExperienceLevel } from "@/lib/constants";
import {
  STATUS_LABELS,
  STATUS_DOT_COLORS,
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

  const sidebar = (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5">
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
          {opportunity.url && (
            <Field label="Posting">
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View posting
              </a>
            </Field>
          )}
        </dl>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-6">
      {opportunity.jobDescription && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold mb-3">Job Description</h2>
          <Markdown>{opportunity.jobDescription}</Markdown>
        </section>
      )}

      {opportunity.notes && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold mb-3">Notes</h2>
          <Markdown>{opportunity.notes}</Markdown>
        </section>
      )}

      {history.length > 0 && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-base font-semibold mb-4">Status Timeline</h2>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${
                    STATUS_DOT_COLORS[entry.status as Status] ?? "bg-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {STATUS_LABELS[entry.status as Status] ?? entry.status}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.changedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  {entry.note && (
                    <div className="text-sm text-foreground mt-1">{entry.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{opportunity.company}</h1>
          <p className="text-lg text-muted-foreground">{opportunity.role}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            status={opportunity.status as Status}
            opportunityId={opportunity.id}
          />
          <OpportunityActions id={opportunity.id} />
        </div>
      </div>

      <div className="lg:hidden">{sidebar}</div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">{mainContent}</div>
        <aside className="hidden lg:block lg:col-span-1">{sidebar}</aside>
      </div>
    </div>
  );
}
