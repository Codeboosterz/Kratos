import { afterEach, describe, expect, it, vi } from "vitest";
import { readMonitorQuery, isConnectionFresh } from "@/src/operations/monitoring";

afterEach(() => vi.restoreAllMocks());
describe("honest monitoring states", () => {
  it("preserves a verified empty result", async () => {
    expect(await readMonitorQuery("webhooks", Promise.resolve({ data: [], count: 0, error: null })))
      .toEqual({ data: [], count: 0, failed: false });
  });
  it.each(["webhooks", "ai", "trainerize", "email", "entitlements", "products", "integrations"] as const)("marks %s query failures unknown and logs no private diagnostics", async (name) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await readMonitorQuery(name, Promise.resolve({ data: [], count: 0, error: { message: "private-db-secret" } })))
      .toEqual({ data: null, count: null, failed: true });
    expect(JSON.stringify(log.mock.calls)).toContain("MONITOR_QUERY_FAILED");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-db-secret");
  });
  it("handles transport rejection", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await readMonitorQuery("ai", Promise.reject(new Error("private")))).toEqual({ data: null, count: null, failed: true });
  });
  it("does not treat old or missing provider checks as current", () => {
    const now = Date.parse("2026-09-19T12:00:00Z");
    expect(isConnectionFresh("2026-09-19T11:00:00Z", now)).toBe(true);
    for (const time of [null, "bad", "2026-08-28T12:00:00Z", "2026-10-01T00:00:00Z"]) expect(isConnectionFresh(time, now)).toBe(false);
  });
});
