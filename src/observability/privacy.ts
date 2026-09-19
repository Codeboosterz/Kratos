// Deliberately no free-form URLs, query strings, record IDs or customer fields.
const publicPaths = ["/", "/resultaten", "/werkwijze", "/trajecten", "/over-omar", "/community", "/gratis-tools", "/contact", "/intake", "/privacy", "/voorwaarden", "/cookies"] as const;
export const telemetryRoutes = [...publicPaths, "/trajecten/[slug]", "/checkout/[slug]", "/checkout/success", "/beheer", "/api/intake", "/api/checkout/session", "/api/telemetry/errors", "/other"] as const;

export function telemetryRoute(path: string): typeof telemetryRoutes[number] {
  const clean = path.split(/[?#]/)[0];
  if ((telemetryRoutes as readonly string[]).includes(clean)) return clean as typeof telemetryRoutes[number];
  if (clean.startsWith("/beheer/")) return "/beheer";
  if (/^\/trajecten\/[^/]+$/.test(clean)) return "/trajecten/[slug]";
  if (/^\/checkout\/[^/]+$/.test(clean)) return "/checkout/[slug]";
  return "/other";
}

export function publicTelemetryUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    // Only fixed public pages. Intake/checkout URLs often carry attribution or
    // confirmation values; never forward arbitrary route parameters to analytics.
    if ((publicPaths as readonly string[]).includes(url.pathname)) return `${url.origin}${url.pathname}`;
    const route = telemetryRoute(url.pathname);
    if (route === "/trajecten/[slug]" || route === "/checkout/[slug]") return `${url.origin}${route}`;
    return null;
  } catch { return null; }
}

export function safeDigest(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{1,20}$/.test(value) ? value : undefined;
}
