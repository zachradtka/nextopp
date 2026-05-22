import { describe, it, expect } from "vitest";
import {
  navItems,
  bottomItems,
  filterNavItems,
  type FeatureFlags,
} from "./nav-items";

const allOff: FeatureFlags = {
  dashboard: false,
  insights: false,
  settings: false,
  alerts: false,
};

describe("filterNavItems", () => {
  it("keeps unflagged items regardless of flag values", () => {
    const result = filterNavItems(navItems, allOff);
    expect(result.map((i) => i.label)).toEqual(["Opportunities", "Archive"]);
  });

  it("hides every flagged item when all flags are off", () => {
    expect(filterNavItems(navItems, allOff)).not.toContainEqual(
      expect.objectContaining({ flag: expect.anything() })
    );
    expect(filterNavItems(bottomItems, allOff)).toEqual([]);
  });

  it("shows a flagged item only when its own flag is on", () => {
    const result = filterNavItems(navItems, { ...allOff, insights: true });
    expect(result.map((i) => i.label)).toEqual([
      "Opportunities",
      "Insights",
      "Archive",
    ]);
  });

  it("gates the Settings bottom item on the settings flag", () => {
    expect(filterNavItems(bottomItems, allOff)).toEqual([]);
    expect(
      filterNavItems(bottomItems, { ...allOff, settings: true }).map((i) => i.label)
    ).toEqual(["Settings"]);
  });

  it("shows all items when every flag is on", () => {
    const allOn: FeatureFlags = {
      dashboard: true,
      insights: true,
      settings: true,
      alerts: true,
    };
    expect(filterNavItems(navItems, allOn)).toHaveLength(navItems.length);
    expect(filterNavItems(bottomItems, allOn)).toHaveLength(bottomItems.length);
  });
});
