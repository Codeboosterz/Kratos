import "server-only";
import { telemetryRoute, safeDigest } from "./privacy";

type OperationalEvent = {
  event: "intake_request" | "checkout_request" | "checkout_configuration" | "catalogue_read" | "monitor_query" | "server_error" | "client_error_reported";
  level?: "info" | "warn" | "error";
  code: string;
  route: string;
  requestId?: string;
  durationMs?: number;
  status?: number;
  digest?: unknown;
  component?: string;
};

export function logOperationalEvent(input: OperationalEvent) {
  const level = input.level ?? "info";
  const payload = {
    event: input.event, level, timestamp: new Date().toISOString(),
    route: telemetryRoute(input.route),
    code: /^[A-Z_]{1,80}$/.test(input.code) ? input.code : "UNKNOWN",
    requestId: /^[a-f0-9-]{36}$/.test(input.requestId ?? "") ? input.requestId : undefined,
    durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(input.durationMs!)) : undefined,
    status: input.status, digest: safeDigest(input.digest),
    component: /^(webhooks|ai|trainerize|email|entitlements|products|integrations|boundary|window|rejection)$/.test(input.component ?? "") ? input.component : undefined,
  };
  // Never serialize the original error, request, headers or submitted payload.
  console[level](JSON.stringify(payload));
}

export function observeRequest(route: string, event: "intake_request" | "checkout_request") {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  logOperationalEvent({ event, route, requestId, code: "REQUEST_STARTED" });
  return {
    respond(body: unknown, init: ResponseInit = {}, code?: string) {
      const status = init.status ?? 200;
      const error = body && typeof body === "object" && "error" in body ? body.error : null;
      const responseCode = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "COMPLETED";
      logOperationalEvent({ event, route, requestId, code: code ?? responseCode, status, durationMs: Date.now() - start,
        level: status >= 500 ? "error" : status >= 400 ? "warn" : "info" });
      const headers = new Headers(init.headers);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Request-Id", requestId);
      return Response.json(body, { ...init, headers });
    },
  };
}
