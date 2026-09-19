import { safeDigest, telemetryRoute } from "./privacy";

let sent = 0;
const seen = new Set<string>();
export function reportClientError(kind: "boundary" | "window" | "rejection", digest?: unknown) {
  if (typeof window === "undefined" || sent >= 5) return;
  const body = { kind, route: telemetryRoute(window.location.pathname), digest: safeDigest(digest) };
  const serialized = JSON.stringify(body);
  if (seen.has(serialized)) return;
  seen.add(serialized);
  sent += 1;
  // No message, stack, query, referrer, form values or customer identifiers.
  void fetch("/api/telemetry/errors", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: serialized,
    credentials: "omit", referrerPolicy: "no-referrer", keepalive: true,
  }).catch(() => { /* Reporting must never break the page or trigger recursion. */ });
}
