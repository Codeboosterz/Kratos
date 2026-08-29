import { describe, expect, it } from "vitest";
import { createClaimToken, hashClaimToken, normalizeFulfillmentState } from "@/src/operations/fulfillment";

describe("digital-product fulfillment", () => {
  it("creates opaque claim tokens and stores only a deterministic hash", () => {
    const token = createClaimToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(hashClaimToken(token)).toHaveLength(64);
    expect(hashClaimToken(token)).toBe(hashClaimToken(token));
    expect(hashClaimToken(token)).not.toContain(token);
  });

  it("fulfills only paid, completed Checkout Sessions", () => {
    expect(normalizeFulfillmentState({ status: "complete", payment_status: "paid" })).toBe("ready");
    expect(normalizeFulfillmentState({ status: "complete", payment_status: "unpaid" })).toBe("waiting_for_payment");
    expect(normalizeFulfillmentState({ status: "expired", payment_status: "unpaid" })).toBe("cancelled");
  });
});
