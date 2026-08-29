import { beforeEach, describe, expect, it, vi } from "vitest";

const intakePayload = { goal: "afvallen", experience: "beginner", format: "online", availability: "Drie avonden", note: "", name: "Ada Tester", email: "ada@example.com", phone: "", contactChannel: "email", consent: true, consentVersion: "2026-08-draft-1", product: null, source: "home-hero", idempotencyKey: "2ddaf20d-2527-4d17-a5da-5c731091d08c" };

describe("route handler integration", () => {
  beforeEach(() => { vi.resetModules(); vi.stubEnv("KRATOS_FIXTURE_MODE", "true"); });

  it("creates an intake fixture without storing form content", async () => {
    const { POST } = await import("@/app/api/intake/route");
    const response = await POST(new Request("http://localhost/api/intake", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": intakePayload.idempotencyKey }, body: JSON.stringify(intakePayload) }));
    const body = await response.json();
    expect(response.status).toBe(201); expect(body.demo).toBe(true); expect(body.reference).toMatch(/^DEMO-INT-/);
  });

  it("creates and verifies a server-owned checkout fixture", async () => {
    const idempotencyKey = "3c30dfd8-96d0-47ac-a009-87521a23b598";
    const { POST } = await import("@/app/api/checkout/session/route");
    const created = await POST(new Request("http://localhost/api/checkout/session", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({ productSlug: "transformatie-pack-10-sessies", idempotencyKey }) }));
    const session = await created.json(); expect(created.status).toBe(200); expect(session.demo).toBe(true);
    const { GET } = await import("@/app/api/checkout/status/route");
    const checked = await GET(new Request(`http://localhost/api/checkout/status?session_id=${session.sessionId}`));
    expect(await checked.json()).toMatchObject({ status: "paid", demo: true, productSlug: "transformatie-pack-10-sessies" });
  });

  it("rejects a checkout request when the idempotency header differs", async () => {
    const { POST } = await import("@/app/api/checkout/session/route");
    const response = await POST(new Request("http://localhost/api/checkout/session", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": "different" }, body: JSON.stringify({ productSlug: "transformatie-pack-10-sessies", idempotencyKey: "3c30dfd8-96d0-47ac-a009-87521a23b598" }) }));
    expect(response.status).toBe(400);
  });
});
