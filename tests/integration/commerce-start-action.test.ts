import { describe, expect, it } from "vitest";
import { getProducts } from "@/src/server/catalogue";
import { resolveStartAction } from "@/src/server/start-action";

describe("every published package leads to its internal checkout", () => {
  it.each(getProducts())("routes $slug without changing its price", async (product) => {
    const original = structuredClone(product);
    expect(await resolveStartAction(product)).toEqual({ kind: "checkout", label: "Bekijk checkout", href: `/checkout/${product.slug}` });
    expect(product).toEqual(original);
  });
  it("does not bypass Stripe checkout for a legacy external configuration", async () => {
    expect((await resolveStartAction({ ...getProducts()[0], checkoutMode: "trainerize_external", trainerizePlanId: "legacy" })).href).toBe(`/checkout/${getProducts()[0].slug}`);
  });
});
