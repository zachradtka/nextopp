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
  saved: "bg-[#F3F4F6] text-[#6B7280]",
  applied: "bg-[#F3F4F6] text-[#6B7280]",
  interviewing: "bg-[#FEF3C7] text-[#F59E0B]",
  offered: "bg-[#D1FAE5] text-[#10B981]",
  rejected: "bg-[#FEE2E2] text-[#EF4444]",
  withdrawn: "bg-[#FEF3C7] text-[#D97706]",
  accepted: "bg-[#D1FAE5] text-[#059669]",
};

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};
