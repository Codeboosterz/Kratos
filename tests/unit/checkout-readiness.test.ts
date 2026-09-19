import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CommerceProduct } from "@/src/server/commerce-catalogue";
const mocks = vi.hoisted(() => ({ origin: "https://kratosfitness.be", resolve: vi.fn() }));
vi.mock("@/src/server/environment", () => ({ get trustedSiteOrigin() { return mocks.origin; } }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.resolve }));
import { getCheckoutConfiguration } from "@/src/server/checkout-configuration";

const product: CommerceProduct = { id: "fixture", slug: "duo-coaching", name: "Fixture", summary: "Fixture", active: true, priceCents: 30000, currency: "eur", stripePriceId: "price_fixture" };
describe("shared checkout readiness", () => {
  beforeEach(() => {
    mocks.origin = "https://kratosfitness.be";
    vi.stubEnv("NODE_ENV", "development");
    const keys: Record<string, string> = { secret_key: "sk_live_fakefixture123", publishable_key: "pk_live_fakefixture123", webhook_secret: "whsec_fakefixture123" };
    mocks.resolve.mockImplementation(async (_provider, slot: string) => keys[slot]);
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(["http://kratosfitness.be", "http://127.0.0.1:3200"])("never prepares live payments on insecure origin %s", async (origin) => {
    mocks.origin = origin;
    expect(await getCheckoutConfiguration(product)).toEqual({ ready: false, reasons: ["HTTPS_REQUIRED"] });
  });
  it.each([
    [{ active: false }, "PRODUCT_INACTIVE"],
    [{ priceCents: null }, "PRICE_MISSING"],
    [{ priceCents: 0 }, "PRICE_MISSING"],
    [{ priceCents: -1 }, "PRICE_MISSING"],
    [{ priceCents: 100.5 }, "PRICE_MISSING"],
    [{ stripePriceId: null }, "STRIPE_PRICE_MISSING"],
  ] as const)("blocks incomplete product configuration: %j", async (override, reason) => {
    expect(await getCheckoutConfiguration({ ...product, ...override })).toEqual({ ready: false, reasons: [reason] });
  });
  it("does not leak an unresolved credential exception", async () => {
    mocks.resolve.mockRejectedValue(new Error("private diagnostic"));
    expect(await getCheckoutConfiguration(product)).toEqual({ ready: false, reasons: ["SECRET_READ_FAILED"] });
  });
});
