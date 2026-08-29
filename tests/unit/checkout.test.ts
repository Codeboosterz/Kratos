import { describe, expect, it } from "vitest";
import { checkoutSessionIdSchema, normalizeStripeCheckoutStatus } from "@/src/schemas/checkout";

describe("checkout status normalization", () => {
  it("treats server payment status as authoritative", () => {
    expect(normalizeStripeCheckoutStatus({ status: "complete", payment_status: "paid" })).toBe("paid");
    expect(normalizeStripeCheckoutStatus({ status: "complete", payment_status: "unpaid" })).toBe("unpaid");
    expect(normalizeStripeCheckoutStatus({ status: "open", payment_status: "unpaid" })).toBe("processing");
    expect(normalizeStripeCheckoutStatus({ status: "expired", payment_status: "unpaid" })).toBe("expired");
  });
  it("accepts only allow-listed session identifier shapes", () => {
    expect(checkoutSessionIdSchema.safeParse("demo_cs_0123456789abcdefab").success).toBe(true);
    expect(checkoutSessionIdSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});
