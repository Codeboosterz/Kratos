import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  resolve: vi.fn(),
  price: vi.fn(),
}));
vi.mock("stripe", () => ({ default: class { checkout = { sessions: { create: mocks.create } }; prices = { retrieve: mocks.price }; } }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.resolve }));
vi.mock("@/src/server/environment", () => ({ fixtureMode: false, trustedSiteOrigin: "https://kratosfitness.be" }));
vi.mock("@/src/server/rate-limit", () => ({ checkDurableRateLimit: async () => ({ allowed: true }), requestClientKey: () => "fixture" }));
vi.mock("@/src/server/commerce-catalogue", () => ({ getCommerceProduct: async () => ({ id: "fixture", slug: "duo-coaching", active: true, priceCents: 30000, currency: "eur", stripePriceId: "price_fixture" }) }));

const testKeys = { secret_key: "sk_test_fakefixture123", publishable_key: "pk_test_fakefixture123", webhook_secret: "whsec_fakefixture123" };
const liveKeys = { secret_key: "sk_live_fakefixture123", publishable_key: "pk_live_fakefixture123", webhook_secret: "whsec_fakefixture123" };
const fixedPrice = { id: "price_fixture", active: true, type: "one_time", currency: "eur", unit_amount: 30000, unit_amount_decimal: "30000", livemode: false, billing_scheme: "per_unit", recurring: null, transform_quantity: null, custom_unit_amount: null };

describe("checkout API configuration gate", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({ id: "cs_test_fixture", client_secret: "cs_test_client_fixture" }); mocks.price.mockResolvedValue({ ...fixedPrice }); });
  afterEach(() => vi.unstubAllEnvs());
  async function submit(keys: Record<string, string | null | undefined>, quote: unknown = { priceCents: 30000, currency: "eur" }) {
    mocks.resolve.mockImplementation(async (_provider, slot: string) => keys[slot] ?? null);
    const { POST } = await import("@/app/api/checkout/session/route");
    const idempotencyKey = "3c30dfd8-96d0-47ac-a009-87521a23b598";
    return POST(new Request("https://kratosfitness.be/api/checkout/session", {
      method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({ productSlug: "duo-coaching", idempotencyKey, quote }),
    }));
  }
  it.each([
    { secret_key: "sk_test_fakefixture123" },
    { secret_key: "sk_test_fakefixture123", publishable_key: "pk_test_fakefixture123" },
    { secret_key: "sk_live_fakefixture123", publishable_key: "pk_test_fakefixture123", webhook_secret: "whsec_fakefixture123" },
  ])("blocks incomplete or mixed-mode configuration before Stripe session creation", async (keys) => {
    expect((await submit(keys)).status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("passes only a client secret, never API credentials, to a ready checkout", async () => {
    const response = await submit({ secret_key: "sk_test_fakefixture123", publishable_key: "pk_test_fakefixture123", webhook_secret: "whsec_fakefixture123" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ demo: false, sessionId: "cs_test_fixture", clientSecret: "cs_test_client_fixture" });
    expect(mocks.create).toHaveBeenCalledOnce();
  });
  it.each([
    { unit_amount: 100 }, { currency: "usd" }, { active: false },
    { type: "recurring", recurring: { interval: "month" } }, { livemode: true },
    { billing_scheme: "tiered" }, { transform_quantity: { divide_by: 10, round: "up" } },
    { custom_unit_amount: { enabled: true } }, { unit_amount_decimal: "30000.5" },
  ])("rejects an incompatible Stripe price before session creation: %j", async (override) => {
    mocks.price.mockResolvedValue({ ...fixedPrice, ...override });
    const response = await submit(testKeys);
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("PRICE_CONFIGURATION_REQUIRED");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([{ priceCents: 100, currency: "eur" }, { priceCents: 30000, currency: "usd" }, undefined])("rejects stale or missing displayed quotes", async (quote) => {
    const response = await submit(testKeys, quote === undefined ? null : quote);
    expect(response.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("requires live mode in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await submit(testKeys)).status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("creates only the existing full-price item in live mode (mocked, no provider call)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.price.mockResolvedValue({ ...fixedPrice, livemode: true });
    expect((await submit(liveKeys)).status).toBe(200);
    expect(mocks.price).toHaveBeenCalledWith("price_fixture");
    expect(mocks.create).toHaveBeenCalledWith({
      mode: "payment", ui_mode: "elements", currency: "eur",
      line_items: [{ price: "price_fixture", quantity: 1 }],
      return_url: "https://kratosfitness.be/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      metadata: { productId: "fixture", productSlug: "duo-coaching" },
    }, { idempotencyKey: "checkout:fixture:3c30dfd8-96d0-47ac-a009-87521a23b598" });
  });
  it("handles price retrieval failure without leaking provider details", async () => {
    mocks.price.mockRejectedValue(new Error("private provider diagnostic"));
    const response = await submit(testKeys);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private provider diagnostic");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
