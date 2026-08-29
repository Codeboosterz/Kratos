import { describe, expect, it } from "vitest";
import { getVerifiedTrainerizeUrl, trainerizePlans } from "@/src/server/trainerize";

describe("Trainerize truth lock", () => {
  it("preserves ten unique exact URLs", () => {
    expect(trainerizePlans).toHaveLength(10);
    expect(new Set(trainerizePlans.map((plan) => plan.url))).toHaveLength(10);
    for (const plan of trainerizePlans) {
      expect(plan.url).toBe(`https://www.trainerize.me/profile/kratoscoaching1/?planGUID=${plan.planGUID}`);
    }
  });

  it("never infers a mapping", () => {
    expect(trainerizePlans.every((plan) => plan.status === "mapping_required" && plan.productSlug === null)).toBe(true);
    expect(getVerifiedTrainerizeUrl("trainerize-plan-01")).toBeNull();
  });
});
