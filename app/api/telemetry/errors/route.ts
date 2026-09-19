import { z } from "zod";
import { telemetryRoutes } from "@/src/observability/privacy";
import { logOperationalEvent } from "@/src/observability/server";
import { checkDurableRateLimit, requestClientKey } from "@/src/server/rate-limit";

const schema = z.object({ kind: z.enum(["boundary", "window", "rejection"]), route: z.enum(telemetryRoutes), digest: z.string().regex(/^\d{1,20}$/).optional() }).strict();
const empty = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin ||
      !request.headers.get("content-type")?.startsWith("application/json")) return empty(403);
  const limit = await checkDurableRateLimit({ namespace: "client-errors", key: requestClientKey(request), limit: 15, windowMs: 60_000 });
  if (!limit.allowed) return empty(429);
  if (Number(request.headers.get("content-length")) > 1024) return empty(413);
  const reader = request.body?.getReader();
  if (!reader) return empty(400);
  let body = "";
  let size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return empty(413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const parsed = schema.safeParse(JSON.parse(body));
    if (!parsed.success) return empty(400);
    // Client reports are untrusted signals, not authoritative server failures.
    logOperationalEvent({ event: "client_error_reported", code: "CLIENT_ERROR", level: "warn", route: parsed.data.route, component: parsed.data.kind, digest: parsed.data.digest });
    return empty(204);
  } catch { return empty(400); }
  finally { reader.releaseLock(); }
}
