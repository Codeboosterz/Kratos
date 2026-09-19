import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ failure: "", rejected: false, draft: false, noIntegrations: false }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: async () => ({ supabase: { from: (table: string) => {
  const result = () => {
    if (table === mocks.failure && mocks.rejected) return Promise.reject(new Error("private-diagnostic"));
    if (table === mocks.failure) return Promise.resolve({ data: null, error: { message: "private-diagnostic" } });
    const data = table === "cms_products" ? [{ id: "fixture", name: "Fixture", slug: "duo-coaching", description: "", status: mocks.draft ? "draft" : "active", price_cents: mocks.draft ? null : 30000, currency: "eur", stripe_price_id: mocks.draft ? null : "price_fixture" }]
      : table === "integration_connections" && !mocks.noIntegrations ? [{ provider: "stripe", status: "connected", last_checked_at: "2026-08-28T12:00:00Z" }] : [];
    return Promise.resolve({ data, count: 0, error: null });
  };
  const query = { select: () => query, in: () => query, eq: () => query, neq: () => query, order: () => query, limit: () => query, then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => result().then(resolve, reject) };
  return query;
} } }) }));
vi.mock("@/src/server/checkout-configuration", () => ({ getCheckoutConfiguration: async (product: { active: boolean }) => product.active ? { ready: true } : { ready: false, reasons: ["PRODUCT_INACTIVE", "PRICE_MISSING", "STRIPE_PRICE_MISSING"] } }));
import MonitoringPage from "@/app/beheer/(protected)/monitoring/page";
beforeEach(() => { mocks.failure = ""; mocks.rejected = false; mocks.draft = false; mocks.noIntegrations = false; });
describe("monitoring page renders unknown instead of false green", () => {
  it.each(["provider_webhook_events", "ai_jobs", "trainerize_provisioning_jobs", "email_messages", "entitlements", "cms_products", "integration_connections"])("does not claim health when %s is unreadable", async (table) => {
    mocks.failure = table;
    const html = renderToStaticMarkup(await MonitoringPage());
    expect(html).toContain("Controle onvolledig");
    expect(html).toContain("onbekend resultaat");
    expect(html).not.toContain("private-diagnostic");
    expect(html).not.toContain("is-healthy");
  });
  it("shows a transport failure and hides the misleading empty queue message", async () => {
    mocks.failure = "provider_webhook_events"; mocks.rejected = true;
    const html = renderToStaticMarkup(await MonitoringPage());
    expect(html).toContain("Controle onvolledig");
    expect(html).not.toContain("Geen vastgelopen webhooks.");
  });
  it("marks draft products blocked regardless of a saved provider connection", async () => {
    mocks.draft = true;
    const html = renderToStaticMarkup(await MonitoringPage());
    expect(html).toContain("Configuratie nodig");
    expect(html).toContain("Stripe price ID ontbreekt");
    expect(html).toContain("Opnieuw controleren");
    expect(html).not.toContain("is-healthy");
  });
  it.each([false, true])("keeps missing or stale provider checks visible (empty: %s)", async (empty) => {
    mocks.noIntegrations = empty;
    const html = renderToStaticMarkup(await MonitoringPage());
    for (const name of ["Stripe", "Resend", "Trainerize", "OpenRouter", "Calendly"]) expect(html).toContain(name);
    expect(html).toContain("Nog niet gecontroleerd");
    expect(html).toContain("Providercontroles nodig");
    expect(html).not.toContain("is-healthy");
  });
});
