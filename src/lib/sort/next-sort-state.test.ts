import { describe, it, expect } from "vitest";
import { nextSortState } from "./next-sort-state";

describe("nextSortState", () => {
  it("returns ASC for the clicked column when none is active", () => {
    expect(nextSortState(null, "company")).toEqual({
      column: "company",
      direction: "asc",
    });
    expect(nextSortState(null, "status")).toEqual({
      column: "status",
      direction: "asc",
    });
  });

  it("flips ASC → DESC when clicking the active column", () => {
    expect(
      nextSortState({ column: "company", direction: "asc" }, "company"),
    ).toEqual({ column: "company", direction: "desc" });
  });

  it("returns null when clicking the active DESC column (clears sort)", () => {
    expect(
      nextSortState({ column: "company", direction: "desc" }, "company"),
    ).toBeNull();
  });

  it("starts a new column at ASC when switching from a different active column", () => {
    expect(
      nextSortState({ column: "company", direction: "asc" }, "status"),
    ).toEqual({ column: "status", direction: "asc" });
    expect(
      nextSortState({ column: "company", direction: "desc" }, "applied_at"),
    ).toEqual({ column: "applied_at", direction: "asc" });
  });
});
