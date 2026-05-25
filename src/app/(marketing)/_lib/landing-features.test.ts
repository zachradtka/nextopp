import { describe, it, expect } from "vitest";
import { landingFeatures } from "./landing-features";
import * as flagsModule from "@/lib/flags";

describe("landing-features", () => {
  it("never advertises a flag-gated feature (ADR-0002)", () => {
    const flagKeys = new Set(
      Object.values(flagsModule)
        .filter(
          (value): value is { key: string } =>
            typeof value === "function" &&
            typeof (value as { key?: unknown }).key === "string",
        )
        .map((flag) => flag.key),
    );

    for (const feature of landingFeatures) {
      if (feature.flagKey === null) continue;
      expect(
        flagKeys.has(feature.flagKey),
        `landingFeatures advertises "${feature.title}" with flagKey "${feature.flagKey}", which matches a gated flag in src/lib/flags.ts — per ADR-0002 only shipped features may appear on the landing page`,
      ).toBe(false);
    }
  });
});
