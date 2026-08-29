import { describe, expect, it } from "vitest";
import { bundledMediaStats, combineMediaStats, formatMediaSize } from "@/src/cms/media-stats";

describe("CMS media statistics", () => {
  it("combines deployed website media with CMS uploads", () => {
    expect(combineMediaStats(2, 1_048_576)).toEqual({
      count: bundledMediaStats.count + 2,
      sizeBytes: bundledMediaStats.sizeBytes + 1_048_576,
    });
  });

  it("formats storage size for the Dutch CMS", () => {
    expect(formatMediaSize(14 * 1024 * 1024)).toBe("14,0 MB");
  });
});
