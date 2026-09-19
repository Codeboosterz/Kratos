import { describe, expect, it } from "vitest";
import { productCheckoutBlockers } from "@/src/operations/checkout-readiness";
describe("checkout blocker diagnostics preserve activation gates", () => {
  const product = { active: true, priceCents: 30000, currency: "eur", stripePriceId: "price_fixture" };
  it("reports all draft configuration gaps", () => {
    expect(productCheckoutBlockers({ ...product, active: false, priceCents: null, stripePriceId: null })).toEqual(["PRODUCT_INACTIVE", "PRICE_MISSING", "STRIPE_PRICE_MISSING"]);
  });
  it("leaves valid, unchanged prices eligible for further provider checks", () => {
    expect(productCheckoutBlockers(product)).toEqual([]);
    expect(product.priceCents).toBe(30000);
  });
  it.each([0, -1, 10.5, NaN])("rejects invalid amount %s", (priceCents) => {
    expect(productCheckoutBlockers({ ...product, priceCents })).toContain("PRICE_MISSING");
  });
});
