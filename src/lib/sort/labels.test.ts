import { describe, it, expect } from "vitest";
import { SORT_COLUMNS } from "./types";
import {
  SORT_COLUMN_LABELS,
  SORT_NATURAL_DESCRIPTORS,
  DEFAULT_SORT_COLUMN,
} from "./labels";

describe("sort labels", () => {
  it("exposes a human label for every sortable column", () => {
    for (const column of SORT_COLUMNS) {
      expect(SORT_COLUMN_LABELS[column]).toBeTruthy();
    }
  });

  it("uses the user-facing column names from the PRD", () => {
    expect(SORT_COLUMN_LABELS.updated_at).toBe("Last Activity");
    expect(SORT_COLUMN_LABELS.company).toBe("Company");
    expect(SORT_COLUMN_LABELS.status).toBe("Status");
    expect(SORT_COLUMN_LABELS.applied_at).toBe("Applied Date");
  });

  it("provides the natural-direction descriptor for each column", () => {
    expect(SORT_NATURAL_DESCRIPTORS.updated_at).toBe("newest first");
    expect(SORT_NATURAL_DESCRIPTORS.company).toBe("A–Z");
    expect(SORT_NATURAL_DESCRIPTORS.status).toBe("workflow order");
    expect(SORT_NATURAL_DESCRIPTORS.applied_at).toBe("most recent");
  });

  it("treats updated_at (Last Activity) as the default sort column", () => {
    expect(DEFAULT_SORT_COLUMN).toBe("updated_at");
  });
});
