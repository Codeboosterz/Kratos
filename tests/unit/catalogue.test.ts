import { describe, expect, it } from "vitest";
import {
  applyCmsProductPresentation,
  filterProducts,
  getProduct,
  getProducts,
  normalizeCategory,
  normalizeGoal,
} from "@/src/server/catalogue";

describe("server-owned product catalogue", () => {
  it("publishes eight active products without unverified prices", () => {
    const products = getProducts();
    expect(products).toHaveLength(8);
    expect(products.every((product) => product.active)).toBe(true);
    expect(products.every((product) => product.priceCents === null && product.priceStatus === "verification_required")).toBe(true);
  });

  it("normalizes filters and resolves only known slugs", () => {
    expect(filterProducts("home_workout", null)).toHaveLength(2);
    expect(filterProducts(normalizeCategory("arbitrary"), normalizeGoal("arbitrary"))).toHaveLength(8);
    expect(getProduct("does-not-exist")).toBeNull();
  });

  it("provides accessible, card-ready presentation metadata", () => {
    const products = getProducts();

    expect(new Set(products.map((product) => product.image))).toHaveLength(products.length);
    expect(products.every((product) => product.image.startsWith("/images/programs/cards/"))).toBe(true);
    expect(products.every((product) => product.imageAlt.trim().length > 0)).toBe(true);
    expect(products.every((product) => (
      product.highlights.length === 3
      && product.highlights.every((highlight) => highlight.trim().length > 0)
    ))).toBe(true);
  });

  it("applies CMS card-detail overrides while upgrading untouched legacy artwork", () => {
    const product = getProduct("premium-online-coaching");
    expect(product).not.toBeNull();
    if (!product) return;

    const updated = applyCmsProductPresentation(product, {
      product_premium_online_coaching_image_url: "/media/programs/cards/premium-online-coaching-hero-v2.jpg",
      product_premium_online_coaching_image_alt: "Omar begeleidt een online coachinggesprek.",
      product_premium_online_coaching_highlight_1: "Wekelijkse check-in",
      product_premium_online_coaching_summary: "Structuur en persoonlijke afstemming, waar je ook traint.",
    });

    expect(updated.image).toBe(product.image);
    expect(updated.summary).toBe(product.summary);
    expect(updated.imageAlt).toBe("Omar begeleidt een online coachinggesprek.");
    expect(updated.highlights).toEqual([
      "Wekelijkse check-in",
      product.highlights[1],
      product.highlights[2],
    ]);
  });

  it("preserves a genuinely custom CMS product image", () => {
    const product = getProduct("premium-online-coaching");
    expect(product).not.toBeNull();
    if (!product) return;

    const updated = applyCmsProductPresentation(product, {
      product_premium_online_coaching_image_url: "https://example.com/custom-coaching.webp",
    });

    expect(updated.image).toBe("https://example.com/custom-coaching.webp");
  });
});
