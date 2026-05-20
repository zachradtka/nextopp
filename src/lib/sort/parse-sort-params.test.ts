import { describe, it, expect } from "vitest";
import { parseSortParams } from "./parse-sort-params";

describe("parseSortParams", () => {
  it("returns null when sort is absent", () => {
    expect(parseSortParams({})).toBeNull();
    expect(parseSortParams({ dir: "asc" })).toBeNull();
  });

  it("returns null when sort column is unknown", () => {
    expect(parseSortParams({ sort: "role" })).toBeNull();
    expect(parseSortParams({ sort: "created_at" })).toBeNull();
    expect(parseSortParams({ sort: "" })).toBeNull();
  });

  it("returns null when direction is invalid", () => {
    expect(parseSortParams({ sort: "company", dir: "ascending" })).toBeNull();
    expect(parseSortParams({ sort: "company", dir: "" })).toBeNull();
    expect(parseSortParams({ sort: "company", dir: "ASC" })).toBeNull();
  });

  it("defaults direction to asc when dir is omitted", () => {
    expect(parseSortParams({ sort: "company" })).toEqual({
      column: "company",
      direction: "asc",
    });
  });

  it("parses each allowed column with each direction", () => {
    expect(parseSortParams({ sort: "company", dir: "asc" })).toEqual({
      column: "company",
      direction: "asc",
    });
    expect(parseSortParams({ sort: "company", dir: "desc" })).toEqual({
      column: "company",
      direction: "desc",
    });
    expect(parseSortParams({ sort: "status", dir: "asc" })).toEqual({
      column: "status",
      direction: "asc",
    });
    expect(parseSortParams({ sort: "applied_at", dir: "desc" })).toEqual({
      column: "applied_at",
      direction: "desc",
    });
    expect(parseSortParams({ sort: "updated_at", dir: "asc" })).toEqual({
      column: "updated_at",
      direction: "asc",
    });
  });
});
