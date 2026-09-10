import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), upsert: vi.fn(), single: vi.fn(), secret: vi.fn(), limit: vi.fn() }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.secret }));
vi.mock("@/src/server/environment", () => ({ fixtureMode: false }));
vi.mock("@/src/server/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })), checkDurableRateLimit: mocks.limit, requestClientKey: () => "test" }));
import { POST } from "@/app/api/intake/route";
import { intakeSchema } from "@/src/schemas/intake";

const valid = { goal: "afvallen", experience: "beginner", format: "online", availability: "Drie avonden", note: "", name: "Test intake", email: "intake@example.invalid", phone: "", contactChannel: "email", consent: true, consentVersion: "2026-08-draft-1", product: null, source: "about-final", idempotencyKey: "2ddaf20d-2527-4d17-a5da-5c731091d08c" };
const submit = (key = valid.idempotencyKey) => POST(new Request("https://kratosfitness.be/api/intake", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": key }, body: JSON.stringify(valid) }));

describe("durable intake capture", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.limit.mockResolvedValue({ allowed: true });
    mocks.secret.mockResolvedValue(null);
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.single.mockResolvedValue({ data: { reference: "KRA-PERSISTED", customer_name: valid.name, customer_email: valid.email }, error: null });
    mocks.admin.mockReturnValue({ from: () => ({ upsert: mocks.upsert, select: () => ({ eq: () => ({ single: mocks.single }) }) }) });
  });
  it("stores the lead independently of Calendly and returns only safe confirmation", async () => {
    const response = await submit();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, reference: "KRA-PERSISTED", schedulingUrl: null });
    expect(mocks.limit).toHaveBeenCalledWith(expect.objectContaining({ namespace: "intake" }));
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ source: "about-final", customer_email: valid.email }), { onConflict: "idempotency_key", ignoreDuplicates: true });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("retries without rewriting the first submission and keeps its reference", async () => {
    const first = await (await submit()).json();
    const retry = await (await submit()).json();
    expect(first.reference).toBe("KRA-PERSISTED");
    expect(retry.reference).toBe(first.reference);
    expect(mocks.upsert.mock.calls.every((call) => call[1].ignoreDuplicates)).toBe(true);
  });
  it("does not report success when server configuration is missing", async () => {
    mocks.admin.mockImplementation(() => { throw new Error("missing secret"); });
    expect((await submit()).status).toBe(503);
    expect(mocks.secret).not.toHaveBeenCalled();
  });
  it.each(["insert", "read", "transport"])("keeps %s failure retryable without provider calls", async (mode) => {
    if (mode === "insert") mocks.upsert.mockResolvedValue({ error: { message: "private DB detail" } });
    if (mode === "read") mocks.single.mockResolvedValue({ data: null, error: {} });
    if (mode === "transport") mocks.upsert.mockRejectedValue(new Error("private transport detail"));
    const response = await submit();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "DATABASE_FAILURE", retryable: true } });
    expect(mocks.secret).not.toHaveBeenCalled();
  });
  it("rejects mismatched retry keys before a database write", async () => {
    expect((await submit("wrong")).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("enforces the durable rate limit", async () => {
    mocks.limit.mockResolvedValue({ allowed: false, retryAfterSeconds: 45 });
    const response = await submit();
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("45");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it.each(["about-hero", "about-final", "method-hero", "method-final", "results-hero", "community"])("accepts published source %s", (source) => {
    expect(intakeSchema.safeParse({ ...valid, source }).success).toBe(true);
  });
});
