import { describe, expect, it } from "vitest";
import { calculateAdultBmi, estimateDailyCalories } from "@/src/operations/free-tools";

describe("deterministic free tools", () => {
  it("calculates adult BMI with the metric formula", () => {
    expect(calculateAdultBmi({ heightCm: 170, weightKg: 70 })).toEqual({ value: 24.2, category: "Gezond gewicht" });
  });

  it("estimates resting and daily energy separately", () => {
    expect(estimateDailyCalories({ heightCm: 180, weightKg: 80, age: 35, formulaSex: "male", activity: "moderate" })).toEqual({ restingKcal: 1755, maintenanceKcal: 2720 });
  });

  it("rejects implausible inputs", () => {
    expect(() => calculateAdultBmi({ heightCm: 20, weightKg: 70 })).toThrow();
  });
});
