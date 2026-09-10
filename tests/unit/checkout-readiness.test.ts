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
    expect(await getCheckoutConfiguration(product)).toEqual({ ready: false });
  });
  it.each([{ active: false }, { priceCents: null }, { priceCents: 0 }, { priceCents: -1 }, { priceCents: 100.5 }, { stripePriceId: null }])("blocks incomplete product configuration: %j", async (override) => {
    expect(await getCheckoutConfiguration({ ...product, ...override })).toEqual({ ready: false });
  });
  it("does not leak an unresolved credential exception", async () => {
    mocks.resolve.mockRejectedValue(new Error("private diagnostic"));
    expect(await getCheckoutConfiguration(product)).toEqual({ ready: false });
  });
});
