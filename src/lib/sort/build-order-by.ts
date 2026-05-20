import { asc, desc, sql, type AnyColumn, type SQL, type SQLWrapper } from "drizzle-orm";
import { opportunities } from "@/lib/db/schema";
import { STATUSES } from "@/lib/constants";
import type { SortDirection, SortState } from "./types";

function buildStatusCaseExpr(): SQL {
  let expr: SQL = sql`case ${opportunities.status}`;
  STATUSES.forEach((status, i) => {
    expr = sql`${expr} when ${status} then ${i}`;
  });
  return sql`(${expr} end)`;
}

const STATUS_CASE = buildStatusCaseExpr();

function ord(
  col: AnyColumn | SQLWrapper,
  direction: SortDirection,
): SQL {
  return direction === "asc" ? asc(col) : desc(col);
}

export function buildOrderBy(state: SortState | null): SQL[] {
  if (state === null) {
    return [desc(opportunities.updatedAt), asc(opportunities.id)];
  }

  switch (state.column) {
    case "company":
      return [
        ord(opportunities.company, state.direction),
        asc(opportunities.role),
        asc(opportunities.id),
      ];
    case "status":
      return [
        ord(STATUS_CASE, state.direction),
        desc(opportunities.updatedAt),
        asc(opportunities.id),
      ];
    case "applied_at":
      return [
        ord(opportunities.appliedAt, state.direction),
        desc(opportunities.updatedAt),
        asc(opportunities.id),
      ];
    case "updated_at":
      return [
        ord(opportunities.updatedAt, state.direction),
        asc(opportunities.company),
        asc(opportunities.id),
      ];
  }
}
