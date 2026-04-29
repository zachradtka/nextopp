export const STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
  "accepted",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
};

export const STATUS_COLORS: Record<Status, string> = {
  saved: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
  applied: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
  interviewing: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  offered: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
  rejected: "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
  withdrawn: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  accepted: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
};

export const STATUS_DOT_COLORS: Record<Status, string> = {
  saved: "bg-[var(--status-dot-saved)]",
  applied: "bg-[var(--status-dot-applied)]",
  interviewing: "bg-[var(--status-dot-interviewing)]",
  offered: "bg-[var(--status-dot-offered)]",
  rejected: "bg-[var(--status-dot-rejected)]",
  withdrawn: "bg-[var(--status-dot-withdrawn)]",
  accepted: "bg-[var(--status-dot-accepted)]",
};

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const EXPERIENCE_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff",
  principal: "Principal",
};
