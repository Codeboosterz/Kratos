import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), secret: vi.fn(), event: vi.fn(), send: vi.fn(), membership: vi.fn(), provision: vi.fn() }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.secret }));
vi.mock("@/src/operations/resend", () => ({ sendDigitalDeliveryEmail: mocks.send }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
vi.mock("@/src/operations/trainerize-api", () => ({ provisionTrainerizeClient: mocks.provision }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("stripe", () => ({ default: class { webhooks = { constructEvent: mocks.event }; } }));
import { POST } from "@/app/api/stripe/webhook/route";
import { resendDigitalDelivery, runTrainerizeProvisioning } from "@/app/beheer/(protected)/bestellingen/actions";

type Call = { table: string; op: string; value?: Record<string, unknown>; options?: Record<string, unknown>; filters: unknown[][] };
type Result = { data?: unknown; error?: { code?: string; message: string } | null };
let calls: Call[];
let respond: (call: Call) => Result;
const id = "2ddaf20d-2527-4d17-a5da-5c731091d08c";
function database() {
  return { from: (table: string) => {
    const call: Call = { table, op: "select", filters: [] };
    const chain = {
      select: () => chain, insert: (value: Call["value"]) => { call.op = "insert"; call.value = value; return chain; },
      upsert: (value: Call["value"], options: Call["options"]) => { call.op = "upsert"; call.value = value; call.options = options; return chain; },
      update: (value: Call["value"]) => { call.op = "update"; call.value = value; return chain; },
      eq: (...args: unknown[]) => { call.filters.push(args); return chain; }, in: () => chain, maybeSingle: () => chain, single: () => chain,
      then: (resolve: (result: Result) => unknown) => { calls.push(call); return Promise.resolve(respond(call)).then(resolve); },
    }; return chain;
  } };
}
function defaults(call: Call): Result {
  if (call.op === "select") {
    if (call.table === "cms_products") return { data: { id, name: "QA only", status: "active", digital_asset_id: id, trainerize_plan_id: id }, error: null };
    if (call.table === "orders") return { data: { id, status: "paid", product_id: id, customer_email: "qa@example.invalid" }, error: null };
    if (call.table === "digital_assets") return { data: { id, status: "ready" }, error: null };
    if (call.table === "entitlements") return { data: null, error: null };
    if (call.table === "trainerize_provisioning_jobs") return { data: { id, order_id: id, trainerize_plan_id: id, status: "queued", attempts: 0 }, error: null };
  }
  return { data: { id, status: "paid", provider_event_id: "evt_qa" }, error: null };
}
function request(signature = true) { return new Request("https://example.invalid/api/stripe/webhook", { method: "POST", headers: signature ? { "stripe-signature": "fixture" } : {}, body: "{}" }); }
function form(key: string) { const value = new FormData(); value.set(key, id); return value; }
const writes = (table: string) => calls.filter(call => call.table === table && call.op !== "select");
beforeEach(() => {
  vi.clearAllMocks(); calls = []; respond = defaults; mocks.admin.mockImplementation(database); mocks.secret.mockResolvedValue("fixture-only");
  mocks.membership.mockResolvedValue({ membership: { role: "owner" } });
  mocks.event.mockReturnValue({ id: "evt_qa", type: "checkout.session.completed", data: { object: { id: "cs_qa", status: "complete", payment_status: "paid", metadata: { productId: id }, customer_email: "qa@example.invalid", amount_total: 100, currency: "eur" } } });
  mocks.send.mockResolvedValue({ id: "email_qa", html: "QA", text: "QA" }); mocks.provision.mockResolvedValue({ status: "completed" });
  vi.stubEnv("RESEND_FROM_EMAIL", "qa@example.invalid");
});
describe("Stripe replay-safe fulfillment (no provider calls)", () => {
  it("requires a signature before any database access", async () => { expect((await POST(request(false))).status).toBe(400); expect(mocks.admin).not.toHaveBeenCalled(); });
  it("inserts orders and provisioning jobs without resetting existing state", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(writes("orders").find(call => call.op === "upsert")?.options?.ignoreDuplicates).toBe(true);
    expect(writes("trainerize_provisioning_jobs")[0]?.options?.ignoreDuplicates).toBe(true);
    expect(writes("entitlements")[0]?.op).toBe("insert");
  });
  it("does not rotate an existing download entitlement on a different event replay", async () => {
    respond = call => call.table === "entitlements" && call.op === "select" ? { data: { id, status: "active" }, error: null } : defaults(call);
    expect((await POST(request())).status).toBe(200); expect(writes("entitlements")).toHaveLength(0); expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["refunded", "cancelled", "fulfilled"])("preserves an already %s order", async status => {
    respond = call => call.table === "orders" && call.op === "select" ? { data: { id, status }, error: null } : defaults(call);
    expect((await POST(request())).status).toBe(200); expect(writes("entitlements")).toHaveLength(0); expect(writes("orders").filter(call => call.op === "update")).toHaveLength(0); expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["trainerize_provisioning_jobs", "orders", "provider_webhook_events"])("does not acknowledge a failed %s checkpoint", async table => {
    respond = call => call.table === table && ((table === "orders" && call.op === "update") || (table === "trainerize_provisioning_jobs" && call.op === "upsert") || (table === "provider_webhook_events" && call.value?.status === "completed")) ? { error: { message: "Unavailable" } } : defaults(call);
    expect((await POST(request())).status).toBe(500);
  });
  it("returns retryable busy rather than acknowledging another in-progress attempt", async () => {
    respond = call => call.table === "provider_webhook_events" && call.op === "insert" ? { error: { code: "23505", message: "Duplicate" } } : call.table === "provider_webhook_events" && call.op === "select" ? { data: { status: "processing", attempts: 1, received_at: new Date().toISOString() } } : defaults(call);
    expect((await POST(request())).status).toBe(503); expect(writes("orders")).toHaveLength(0);
  });
  it("checks persistence before acknowledging an ignored event", async () => {
    mocks.event.mockReturnValue({ id: "evt_qa", type: "payment_intent.created", data: {} });
    respond = call => call.value?.status === "ignored" ? { error: { message: "Unavailable" } } : defaults(call);
    expect((await POST(request())).status).toBe(500);
  });
});
describe("Owner fulfillment recovery", () => {
  it.each([resendDigitalDelivery, runTrainerizeProvisioning])("denies editor recovery", async action => {
    mocks.membership.mockResolvedValue({ membership: { role: "editor" } });
    await expect(action(form(action === resendDigitalDelivery ? "orderId" : "jobId"))).rejects.toThrow("owner-required"); expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.provision).not.toHaveBeenCalled();
  });
  it.each([resendDigitalDelivery, runTrainerizeProvisioning])("does not grant access for an unpaid/refunded order", async action => {
    respond = call => call.table === "orders" && call.op === "select" ? { data: { id, status: "refunded", product_id: id, customer_email: "qa@example.invalid" } } : defaults(call);
    await expect(action(form(action === resendDigitalDelivery ? "orderId" : "jobId"))).rejects.toThrow("order-not-paid"); expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.provision).not.toHaveBeenCalled();
  });
  it("preserves the configuration-required result instead of catching its redirect", async () => {
    mocks.provision.mockResolvedValue({ status: "configuration_required" });
    await expect(runTrainerizeProvisioning(form("jobId"))).rejects.toThrow("trainerize-config-required");
  });
  it("does not rerun completed provisioning", async () => {
    respond = call => call.table === "trainerize_provisioning_jobs" && call.op === "select" ? { data: { id, status: "completed", order_id: id, attempts: 1 } } : defaults(call);
    await expect(runTrainerizeProvisioning(form("jobId"))).rejects.toThrow("trainerize-complete"); expect(mocks.provision).not.toHaveBeenCalled();
  });
});
