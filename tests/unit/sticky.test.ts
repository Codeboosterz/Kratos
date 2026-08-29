import { describe, expect, it } from "vitest";
import { shouldShowStickyCta } from "@/components/sticky-intake-cta";

describe("sticky intake visibility", () => {
  it("shows only between both sentinels without competition", () => {
    expect(shouldShowStickyCta({ hydrated: true, blockedRoute: false, competingAction: false, heroVisible: false, finalVisible: false })).toBe(true);
    expect(shouldShowStickyCta({ hydrated: true, blockedRoute: false, competingAction: false, heroVisible: true, finalVisible: false })).toBe(false);
    expect(shouldShowStickyCta({ hydrated: true, blockedRoute: true, competingAction: false, heroVisible: false, finalVisible: false })).toBe(false);
    expect(shouldShowStickyCta({ hydrated: true, blockedRoute: false, competingAction: true, heroVisible: false, finalVisible: false })).toBe(false);
  });
});
