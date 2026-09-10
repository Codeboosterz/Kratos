import "server-only";
import type { createAdminClient } from "@/src/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;
type EventKey = { provider: "resend" | "calendly" | "stripe"; provider_event_id: string };
type Claim = { state: "claimed"; attempt: number } | { state: "duplicate" } | { state: "busy" };
const leaseMs = 5 * 60_000;

export function assertPersisted(result: { error: unknown }, message: string) {
  if (result.error) throw new Error(message);
}

export async function claimWebhookEvent(admin: Admin, event: EventKey & { event_type: string; payload_hash: string }): Promise<Claim> {
  const now = new Date().toISOString();
  const { error } = await admin.from("provider_webhook_events").insert({ ...event, status: "processing", attempts: 1, received_at: now });
  if (!error) return { state: "claimed", attempt: 1 };
  if (error.code !== "23505") throw new Error("Webhookregistratie mislukt.");
  const result = await admin.from("provider_webhook_events").select("status, attempts, received_at")
    .eq("provider", event.provider).eq("provider_event_id", event.provider_event_id).maybeSingle();
  assertPersisted(result, "Webhookstatus kon niet worden gelezen.");
  const existing = result.data;
  if (!existing) throw new Error("Webhookregistratie ontbreekt.");
  if (existing.status === "completed" || existing.status === "ignored") return { state: "duplicate" };
  if (existing.status === "processing" && Date.now() - Date.parse(existing.received_at) < leaseMs) return { state: "busy" };
  // Compare-and-set: only one retry may own this attempt. received_at now records
  // receipt of the latest processing attempt, including recovery after a crash.
  const claimed = await admin.from("provider_webhook_events").update({ status: "processing", attempts: existing.attempts + 1, received_at: now, last_error: null })
    .eq("provider", event.provider).eq("provider_event_id", event.provider_event_id)
    .eq("status", existing.status).eq("attempts", existing.attempts).eq("received_at", existing.received_at)
    .select("provider_event_id").maybeSingle();
  assertPersisted(claimed, "Webhook kon niet opnieuw worden ingepland.");
  return claimed.data ? { state: "claimed", attempt: existing.attempts + 1 } : { state: "busy" };
}

export async function finishWebhookEvent(admin: Admin, key: EventKey, attempt: number, status: "completed" | "ignored" | "failed", warning: string | null = null) {
  const result = await admin.from("provider_webhook_events").update({ status,
    processed_at: status !== "failed" ? new Date().toISOString() : null,
    last_error: status === "failed" ? "Verwerking niet voltooid. Automatisch opnieuw proberen via de provider." : warning,
  }).eq("provider", key.provider).eq("provider_event_id", key.provider_event_id)
    .eq("status", "processing").eq("attempts", attempt).select("provider_event_id").maybeSingle();
  assertPersisted(result, "Webhookresultaat kon niet worden opgeslagen.");
  if (!result.data) throw new Error("Webhookclaim is niet meer actief.");
}
