import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock("@/src/server/rate-limit", () => ({ checkDurableRateLimit: mocks.limit, requestClientKey: () => "local" }));
import { POST } from "@/app/api/telemetry/errors/route";
const valid = { kind: "boundary", route: "/intake", digest: "123456789" };
const request = (body: string, origin = "https://kratosfitness.be") => new Request("https://kratosfitness.be/api/telemetry/errors", { method: "POST", headers: { origin, "content-type": "application/json" }, body });
beforeEach(() => { mocks.limit.mockResolvedValue({ allowed: true }); vi.restoreAllMocks(); });
describe("bounded first-party error reporting", () => {
  it("logs only a validated redacted report", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await POST(request(JSON.stringify(valid)))).status).toBe(204);
    expect(JSON.stringify(spy.mock.calls)).toContain("client_error_reported");
  });
  it("rejects cross-origin, arbitrary fields, private routes and large bodies", async () => {
    expect((await POST(request(JSON.stringify(valid), "https://other.example"))).status).toBe(403);
    expect((await POST(request(JSON.stringify({ ...valid, message: "private contact" })))).status).toBe(400);
    expect((await POST(request(JSON.stringify({ ...valid, route: "/intake?email=private" })))).status).toBe(400);
    expect((await POST(request("x".repeat(2048)))).status).toBe(413);
  });
  it("rate limits reports", async () => {
    mocks.limit.mockResolvedValue({ allowed: false, retryAfterSeconds: 20 });
    expect((await POST(request(JSON.stringify(valid)))).status).toBe(429);
  });
});
