import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), secret: vi.fn(), verify: vi.fn(), receiving: vi.fn(), membership: vi.fn(), send: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.secret }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
vi.mock("@/src/operations/resend", () => ({ sendCmsReply: mocks.send }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("resend", () => ({ Resend: class { webhooks = { verify: mocks.verify }; emails = { receiving: { get: mocks.receiving } }; } }));
import { POST } from "@/app/api/resend/webhook/route";
import { POST as calendlyPost } from "@/app/api/calendly/webhook/route";
import { replyToInboxThread } from "@/app/beheer/(protected)/inbox/actions";

type Call = { table: string; op: string; value?: Record<string, unknown>; filters: unknown[][] };
type Result = { data?: unknown; error?: { code?: string; message: string } | null };
let calls: Call[];
let respond: (call: Call) => Result;
const id = "2ddaf20d-2527-4d17-a5da-5c731091d08c";
function database() {
  return { from: (table: string) => {
    const call: Call = { table, op: "select", filters: [] };
    const chain = {
      select: () => chain, insert: (value: Call["value"]) => { call.op = "insert"; call.value = value; return chain; },
      upsert: (value: Call["value"]) => { call.op = "upsert"; call.value = value; return chain; },
      update: (value: Call["value"]) => { call.op = "update"; call.value = value; return chain; },
      eq: (...args: unknown[]) => { call.filters.push(args); return chain; },
      in: () => chain, order: () => chain, limit: () => chain, maybeSingle: () => chain, single: () => chain,
      then: (resolve: (result: Result) => unknown) => { calls.push(call); return Promise.resolve(respond(call)).then(resolve); },
    }; return chain;
  } };
}
function request() { return new Request("https://example.test/api/resend/webhook", { method: "POST", headers: { "svix-id": "evt_fixture", "svix-timestamp": "1", "svix-signature": "fixture" }, body: "{}" }); }
function defaults(call: Call): Result {
  if (call.table === "email_messages" && call.op === "select") return { data: null, error: null };
  return { data: { id, thread_id: id, provider_event_id: "evt_fixture", customer_email: "qa@example.invalid", subject: "QA only", attempts: 2 }, error: null };
}
const completed = () => calls.some(call => call.table === "provider_webhook_events" && call.value?.status === "completed");

describe("Calendly signed persistence", () => {
  beforeEach(() => { vi.clearAllMocks(); calls = []; respond = defaults; mocks.admin.mockImplementation(database); mocks.secret.mockResolvedValue("fixture-secret"); });
  function calendlyRequest() {
    const raw = JSON.stringify({ event: "invitee.created", created_at: new Date().toISOString(), payload: {
      uri: "https://api.calendly.com/scheduled_events/event-1/invitees/invitee-1", event: "https://api.calendly.com/scheduled_events/event-1",
      email: "qa@example.invalid", name: "QA only", status: "active", timezone: "Europe/Brussels", tracking: { utm_campaign: "KRA-26-A1B2C3" },
      scheduled_event: { name: "QA intake", start_time: "2026-09-12T08:00:00Z", end_time: "2026-09-12T08:30:00Z" },
    } });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", "fixture-secret").update(`${timestamp}.${raw}`).digest("hex");
    return new Request("https://example.test/api/calendly/webhook", { method: "POST", body: raw, headers: { "calendly-webhook-signature": `t=${timestamp},v1=${signature}` } });
  }
  it("stores a signed appointment and updates its intake before completing", async () => {
    expect((await calendlyPost(calendlyRequest())).status).toBe(200);
    expect(calls.find(call => call.table === "calendar_appointments")?.value?.status).toBe("scheduled");
    expect(calls.find(call => call.table === "intake_requests")?.value?.appointment_status).toBe("scheduled");
    expect(completed()).toBe(true);
  });
  it.each(["calendar_appointments", "intake_requests"])("does not acknowledge failed %s persistence", async (table) => {
    respond = call => call.table === table ? { error: { message: "Database unavailable" } } : defaults(call);
    expect((await calendlyPost(calendlyRequest())).status).toBe(500); expect(completed()).toBe(false);
  });
});

describe("Resend persistence and retry boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks(); calls = []; respond = defaults;
    mocks.admin.mockImplementation(database); mocks.secret.mockResolvedValue("fixture-secret");
    mocks.verify.mockReturnValue({ type: "email.received", data: { email_id: "email_fixture" } });
    mocks.receiving.mockResolvedValue({ data: { from: "QA Person <qa@example.invalid>", to: ["inbox@example.invalid"], subject: "QA only", text: "Fixture", html: null }, error: null });
  });
  it("rejects an invalid signature before database access", async () => {
    mocks.verify.mockImplementationOnce(() => { throw new Error("bad signature"); });
    expect((await POST(request())).status).toBe(400); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("stores a message idempotently and uses a replyable email address", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(calls.some(call => call.table === "email_messages" && call.op === "upsert")).toBe(true);
    expect(calls.find(call => call.table === "email_threads" && call.op === "select")?.filters).toContainEqual(["customer_email", "qa@example.invalid"]);
    expect(completed()).toBe(true);
  });
  it.each(["email_messages", "email_threads", "provider_webhook_events"])("does not acknowledge an unchecked %s write failure", async (table) => {
    respond = call => call.table === table && (call.op === "upsert" || call.op === "insert" && table === "email_messages" || call.op === "update" && call.value?.status !== "failed")
      ? { error: { message: "Database temporarily unavailable" } } : defaults(call);
    expect((await POST(request())).status).toBeGreaterThanOrEqual(500);
    if (table !== "provider_webhook_events") expect(completed()).toBe(false);
  });
  it.each(["failed", "processing", "completed"])("handles a duplicate %s event without dropping pending work", async (status) => {
    respond = call => {
      if (call.table === "provider_webhook_events" && call.op === "insert") return { error: { code: "23505", message: "duplicate" } };
      if (call.table === "provider_webhook_events" && call.op === "select") return { data: { status, attempts: 1, received_at: new Date().toISOString() }, error: null };
      return defaults(call);
    };
    expect((await POST(request())).status).toBe(status === "processing" ? 503 : 200);
    expect(mocks.receiving).toHaveBeenCalledTimes(status === "failed" ? 1 : 0);
  });
  it("reclaims a stale processing attempt with compare-and-set", async () => {
    respond = call => {
      if (call.table === "provider_webhook_events" && call.op === "insert") return { error: { code: "23505", message: "duplicate" } };
      if (call.table === "provider_webhook_events" && call.op === "select") return { data: { status: "processing", attempts: 1, received_at: "2026-01-01T00:00:00Z" }, error: null };
      return defaults(call);
    };
    expect((await POST(request())).status).toBe(200);
    const claim = calls.find(call => call.value?.status === "processing" && call.op === "update");
    expect(claim?.filters).toContainEqual(["attempts", 1]);
    expect(claim?.filters).toContainEqual(["status", "processing"]);
    expect(mocks.receiving).toHaveBeenCalledOnce();
  });
  it("does not process an event when a competing worker won the claim", async () => {
    respond = call => {
      if (call.table !== "provider_webhook_events") return defaults(call);
      if (call.op === "insert") return { error: { code: "23505", message: "duplicate" } };
      if (call.op === "select") return { data: { status: "failed", attempts: 1, received_at: "2026-01-01T00:00:00Z" }, error: null };
      return { data: null, error: null };
    };
    expect((await POST(request())).status).toBe(503); expect(mocks.receiving).not.toHaveBeenCalled();
  });
});

describe("CMS outbound message durability", () => {
  beforeEach(() => {
    vi.clearAllMocks(); calls = []; respond = defaults;
    mocks.admin.mockImplementation(database); mocks.secret.mockResolvedValue("fixture-secret");
    mocks.membership.mockResolvedValue({ membership: { role: "owner" } });
    mocks.send.mockResolvedValue("email_fixture"); vi.stubEnv("RESEND_FROM_EMAIL", "qa@example.invalid");
  });
  function reply() { const form = new FormData(); form.set("threadId", id); form.set("text", "QA only"); return form; }
  it("denies editor access before sending", async () => {
    mocks.membership.mockResolvedValue({ membership: { role: "editor" } });
    await expect(replyToInboxThread(reply())).rejects.toThrow("owner-required"); expect(mocks.send).not.toHaveBeenCalled();
  });
  it("reports a failed message save and reuses the provider idempotency key on retry", async () => {
    respond = call => call.table === "email_messages" ? { error: { message: "Database unavailable" } } : defaults(call);
    await expect(replyToInboxThread(reply())).rejects.toThrow("send-failed");
    respond = defaults;
    await expect(replyToInboxThread(reply())).rejects.toThrow("status=sent");
    expect(mocks.send.mock.calls[0][0].idempotencyKey).toBe(mocks.send.mock.calls[1][0].idempotencyKey);
    expect(calls.some(call => call.table === "email_messages" && call.op === "upsert")).toBe(true);
  });
});
