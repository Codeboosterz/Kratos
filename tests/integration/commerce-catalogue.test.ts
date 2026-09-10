import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), fallback: vi.fn() }));
vi.mock("@/src/server/catalogue", () => ({ getProduct: mocks.fallback }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.query }) }) }) }) }));
import { getCommerceProduct } from "@/src/server/commerce-catalogue";

describe("commerce lookup fail-closed boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("SUPABASE_SECRET_KEY", "fixture-only");
    mocks.fallback.mockReturnValue({ id: "fixture", slug: "duo-coaching", name: "Static", summary: "Static description", checkoutMode: "stripe_internal", priceStatus: "verified", priceCents: 30000, stripePriceId: "price_old" });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each([{ data: null, error: { message: "unavailable" } }, { data: null, error: null }])("cannot sell static prices when CMS lookup fails or is empty", async (result) => {
    mocks.query.mockResolvedValue(result);
    expect((await getCommerceProduct("duo-coaching"))?.active).toBe(false);
  });
  it("preserves the exact CMS price and status", async () => {
    mocks.query.mockResolvedValue({ data: { id: "fixture", slug: "duo-coaching", name: "CMS", description: "CMS description", status: "active", price_cents: 12345, currency: "eur", stripe_price_id: "price_existing" }, error: null });
    expect(await getCommerceProduct("duo-coaching")).toMatchObject({ active: true, priceCents: 12345, stripePriceId: "price_existing" });
  });
});
