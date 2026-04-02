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
  saved: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewing: "bg-yellow-100 text-yellow-800",
  offered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-orange-100 text-orange-800",
  accepted: "bg-emerald-100 text-emerald-800",
};
