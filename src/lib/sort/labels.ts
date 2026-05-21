import type { SortColumn, SortDirection } from "./types";

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  company: "Company",
  status: "Status",
  applied_at: "Applied Date",
  updated_at: "Last Activity",
};

export const SORT_NATURAL_DESCRIPTORS: Record<SortColumn, string> = {
  company: "A–Z",
  status: "workflow order",
  applied_at: "most recent",
  updated_at: "newest first",
};

export const SORT_NATURAL_DIRECTIONS: Record<SortColumn, SortDirection> = {
  company: "asc",
  status: "asc",
  applied_at: "desc",
  updated_at: "desc",
};

export const DEFAULT_SORT_COLUMN: SortColumn = "updated_at";
