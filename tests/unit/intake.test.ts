import { describe, expect, it } from "vitest";
import { intakeSchema } from "@/src/schemas/intake";

const valid = { goal: "afvallen", experience: "beginner", format: "online", availability: "Drie avonden", note: "", name: "Ada Tester", email: "ada@example.com", phone: "", contactChannel: "email", consent: true, consentVersion: "2026-08-draft-1", product: null, source: "home-hero", idempotencyKey: "2ddaf20d-2527-4d17-a5da-5c731091d08c" };

describe("intake schema", () => {
  it("accepts the documented contract", () => { expect(intakeSchema.safeParse(valid).success).toBe(true); });
  it("rejects missing consent and arbitrary source values", () => {
    expect(intakeSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(intakeSchema.safeParse({ ...valid, source: "campaign-x" }).success).toBe(false);
  });

  it("preserves product-detail attribution from trajectory pages", () => {
    expect(intakeSchema.safeParse({ ...valid, source: "product-detail" }).success).toBe(true);
  });
});
