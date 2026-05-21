import type { SortColumn, SortState } from "./types";

export function nextSortState(
  current: SortState | null,
  clicked: SortColumn,
): SortState | null {
  if (current === null || current.column !== clicked) {
    return { column: clicked, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { column: clicked, direction: "desc" };
  }
  return null;
}
