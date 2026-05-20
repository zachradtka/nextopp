export const SORT_COLUMNS = [
  "company",
  "status",
  "applied_at",
  "updated_at",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export type SortState = {
  column: SortColumn;
  direction: SortDirection;
};
