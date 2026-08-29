import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/src/supabase/admin";

type Entry = { count: number; resetAt: number };
const stores = new Map<string, Map<string, Entry>>();

export function checkRateLimit(input: { namespace: string; key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const store = stores.get(input.namespace) ?? new Map<string, Entry>();
  stores.set(input.namespace, store);
  const current = store.get(input.key);
  if (!current || current.resetAt <= now) {
    store.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  if (current.count > input.limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function requestClientKey(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "local-or-unknown";
}

export async function checkDurableRateLimit(input: { namespace: string; key: string; limit: number; windowMs: number }) {
  if (!process.env.SUPABASE_SECRET_KEY?.trim()) return checkRateLimit(input);
  try {
    const keyHash = createHash("sha256").update(`${input.namespace}:${input.key}`, "utf8").digest("hex");
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_api_rate_limit", {
      target_namespace: input.namespace,
      target_key_hash: keyHash,
      target_limit: input.limit,
      target_window_seconds: Math.max(1, Math.ceil(input.windowMs / 1_000)),
    });
    if (error || !data?.[0]) return checkRateLimit(input);
    return { allowed: data[0].allowed, retryAfterSeconds: data[0].retry_after_seconds };
  } catch {
    return checkRateLimit(input);
  }
}
