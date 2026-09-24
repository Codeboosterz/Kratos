import { describe, expect, it } from "vitest";
import { getProducts } from "@/src/server/catalogue";
import { resolveStartAction } from "@/src/server/start-action";

describe("published product start actions", () => {
  it.each(getProducts())("routes unpriced $slug to a selected price request", async (product) => {
    const original = structuredClone(product);
    expect(await resolveStartAction(product)).toEqual({ kind: "request", label: "Vraag prijs en trajectinformatie aan", href: `/intake?source=product-detail&product=${product.slug}&intent=price` });
    expect(product).toEqual(original);
  });
  it("keeps confirmed internal checkout available", async () => {
    const product = { ...getProducts()[0], priceStatus: "verified" as const, checkoutMode: "stripe_internal" as const, priceCents: 10000, priceUnit: "per_package" as const, stripePriceId: "price_confirmed" };
    expect(await resolveStartAction(product)).toEqual({ kind: "checkout", label: "Bekijk checkout", href: `/checkout/${product.slug}` });
  });
  it("never sends a legacy external configuration to checkout", async () => {
    const product = { ...getProducts()[0], checkoutMode: "trainerize_external" as const, trainerizePlanId: "legacy" };
    expect((await resolveStartAction(product)).kind).toBe("request");
  });
});
