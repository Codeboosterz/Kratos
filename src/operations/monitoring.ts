import "server-only";
import { logOperationalEvent } from "@/src/observability/server";

type MonitorName = "webhooks" | "ai" | "trainerize" | "email" | "entitlements" | "products" | "integrations";
export async function readMonitorQuery<T>(name: MonitorName, query: PromiseLike<{ data: T | null; error: unknown; count?: number | null }>) {
  try {
    const result = await query;
    if (result.error || (result.data === null && result.count == null)) throw new Error("Monitor unavailable");
    return { data: result.data, count: result.count ?? null, failed: false };
  } catch {
    logOperationalEvent({ event: "monitor_query", level: "error", route: "/beheer", code: "MONITOR_QUERY_FAILED", component: name });
    return { data: null, count: null, failed: true };
  }
}

export function isConnectionFresh(checkedAt: string | null, now = Date.now()) {
  const checked = checkedAt ? Date.parse(checkedAt) : NaN;
  return Number.isFinite(checked) && checked <= now && now - checked < 24 * 60 * 60 * 1000;
}
