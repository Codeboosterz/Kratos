import { afterEach, describe, expect, it, vi } from "vitest";
import { telemetryRoute, publicTelemetryUrl } from "@/src/observability/privacy";
import { logOperationalEvent, observeRequest } from "@/src/observability/server";
import { onRequestError } from "@/instrumentation";

afterEach(() => vi.restoreAllMocks());
describe("redacted operational telemetry", () => {
  it("normalizes routes without logging tokens, searches or personal paths", () => {
    expect(telemetryRoute("/intake?email=private@example.com#secret")).toBe("/intake");
    expect(telemetryRoute("/checkout/success?session_id=private")).toBe("/checkout/success");
    expect(telemetryRoute("/trajecten/private-slug")).toBe("/trajecten/[slug]");
    expect(telemetryRoute("/beheer/inbox?email=private")).toBe("/beheer");
    expect(telemetryRoute("/downloads/private-token")).toBe("/other");
    expect(telemetryRoute("https://private.example/anything")).toBe("/other");
  });
  it("allows only public analytics URLs, without query, fragments or userinfo", () => {
    expect(publicTelemetryUrl("https://kratosfitness.be/intake?email=private#secret")).toBe("https://kratosfitness.be/intake");
    for (const path of ["/beheer", "/beheer/inbox", "/checkout/success", "/downloads/token", "/api/intake", "/unknown"]) {
      expect(publicTelemetryUrl(`https://kratosfitness.be${path}`)).toBeNull();
    }
    expect(publicTelemetryUrl("https://user:secret@kratosfitness.be/intake")).toBeNull();
  });
  it("correlates responses and only serializes allow-listed log fields", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logOperationalEvent({ event: "intake_request", code: "DATABASE_FAILURE", route: "/intake?secret=hidden", level: "error" });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("hidden");
    const observer = observeRequest("/api/intake", "intake_request");
    const response = observer.respond({ error: "safe" }, { status: 503 }, "DATABASE_FAILURE");
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const event = JSON.parse(spy.mock.calls.at(-1)![0]);
    expect(event).toMatchObject({ code: "DATABASE_FAILURE", status: 503, requestId: response.headers.get("x-request-id"), route: "/api/intake" });
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });
  it("reports Next failures without the private error or request context", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await onRequestError(Object.assign(new Error("private email and secret"), { digest: "123456" }),
      { path: "/beheer/inbox?email=private", method: "GET", headers: { authorization: "private-token" } },
      { routerKind: "App Router", routePath: "/beheer/inbox", routeType: "render", renderSource: "react-server-components", revalidateReason: undefined });
    expect(JSON.parse(spy.mock.calls[0][0])).toMatchObject({ event: "server_error", route: "/beheer", digest: "123456" });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("private");
  });
});
