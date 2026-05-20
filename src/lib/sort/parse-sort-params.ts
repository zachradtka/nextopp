import {
  SORT_COLUMNS,
  SORT_DIRECTIONS,
  type SortColumn,
  type SortDirection,
  type SortState,
} from "./types";

export type SortSearchParams = {
  sort?: string;
  dir?: string;
};

function isSortColumn(value: string): value is SortColumn {
  return (SORT_COLUMNS as readonly string[]).includes(value);
}

function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(value);
}

export function parseSortParams(params: SortSearchParams): SortState | null {
  const sort = params.sort;
  if (!sort || !isSortColumn(sort)) return null;

  const dir = params.dir;
  if (dir === undefined) {
    return { column: sort, direction: "asc" };
  }
  if (!isSortDirection(dir)) return null;

  return { column: sort, direction: dir };
}
