import { Resend } from "resend";
import { z } from "zod";
import { hashWebhookPayload } from "@/src/operations/stripe-fulfillment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { createAdminClient } from "@/src/supabase/admin";
import { assertPersisted, claimWebhookEvent, finishWebhookEvent } from "@/src/operations/webhook-events";

const deliveryStates: Record<string, "sent" | "delivered" | "bounced" | "complained" | "suppressed" | "failed"> = {
  "email.sent": "sent", "email.delivered": "delivered", "email.bounced": "bounced", "email.complained": "complained", "email.suppressed": "suppressed", "email.failed": "failed",
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const id = request.headers.get("svix-id"); const timestamp = request.headers.get("svix-timestamp"); const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return Response.json({ error: { code: "INVALID_INPUT", message: "Webhookheaders ontbreken." } }, { status: 400 });
  const [webhookSecret, apiKey] = await Promise.all([resolveIntegrationSecret("resend", "webhook_secret").catch(() => null), resolveIntegrationSecret("resend", "api_key").catch(() => null)]);
  if (!webhookSecret) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Resend webhook secret ontbreekt." } }, { status: 503 });
  let event: ReturnType<Resend["webhooks"]["verify"]>;
  try { event = new Resend(apiKey ?? "re_webhook_verification").webhooks.verify({ payload: rawBody, headers: { id, timestamp, signature }, webhookSecret }); }
  catch { return Response.json({ error: { code: "INVALID_SIGNATURE", message: "Ongeldige webhookhandtekening." } }, { status: 400 }); }
  let admin;
  try { admin = createAdminClient(); } catch { return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Inboxopslag ontbreekt." } }, { status: 503 }); }
  const key = { provider: "resend" as const, provider_event_id: id };
  let attempt: number;
  try {
    const claim = await claimWebhookEvent(admin, { ...key, event_type: event.type, payload_hash: hashWebhookPayload(rawBody) });
    if (claim.state === "duplicate") return Response.json({ received: true, duplicate: true });
    if (claim.state === "busy") return Response.json({ error: { code: "RETRY_LATER", message: "Webhook wordt nog verwerkt." } }, { status: 503 });
    attempt = claim.attempt;
  } catch { return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet worden opgeslagen." } }, { status: 503 }); }

  try {
    if (event.type === "email.received") {
      if (!apiKey) throw new Error("Resend API key ontbreekt voor inbound content.");
      const resend = new Resend(apiKey);
      const { data: received, error } = await resend.emails.receiving.get(event.data.email_id);
      if (error || !received) throw new Error(error?.message ?? "Inbound e-mail kon niet worden opgehaald.");
      const sender = z.email().parse((received.from.match(/<([^<>]+)>\s*$/)?.[1] ?? received.from).trim());
      const savedMessage = await admin.from("email_messages").select("thread_id").eq("provider_message_id", event.data.email_id).maybeSingle();
      assertPersisted(savedMessage, "Inboxbericht kon niet worden gelezen.");
      const existingThread = savedMessage.data ? null : await admin.from("email_threads").select("id").eq("customer_email", sender).in("status", ["open", "waiting"]).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
      if (existingThread) assertPersisted(existingThread, "Inboxthread kon niet worden gelezen.");
      let threadId = savedMessage.data?.thread_id ?? existingThread?.data?.id;
      if (!threadId) {
        const { data: thread, error: threadError } = await admin.from("email_threads").insert({ customer_email: sender, subject: received.subject || "Bericht via website", status: "open", last_message_at: new Date().toISOString() }).select("id").single();
        if (threadError || !thread) throw new Error("Inboxthread kon niet worden gemaakt.");
        threadId = thread.id;
      }
      assertPersisted(await admin.from("email_messages").upsert({
        thread_id: threadId, provider_message_id: event.data.email_id, direction: "inbound", sender: received.from,
        recipients: received.to, subject: received.subject || "Bericht via website", text_body: received.text ?? null,
        html_body: received.html ?? null, delivery_status: "received",
      }, { onConflict: "provider_message_id", ignoreDuplicates: true }), "Inboxbericht kon niet worden opgeslagen.");
      assertPersisted(await admin.from("email_threads").update({ status: "open", last_message_at: new Date().toISOString() }).eq("id", threadId), "Inboxthread kon niet worden bijgewerkt.");
    } else if (event.type in deliveryStates && "email_id" in event.data) {
      assertPersisted(await admin.from("email_messages").update({ delivery_status: deliveryStates[event.type] }).eq("provider_message_id", event.data.email_id), "Bezorgstatus kon niet worden opgeslagen.");
    }
    await finishWebhookEvent(admin, key, attempt, "completed");
    return Response.json({ received: true });
  } catch {
    await finishWebhookEvent(admin, key, attempt, "failed").catch(() => undefined);
    return Response.json({ error: { code: "PROCESSING_FAILED", message: "Webhook is opgeslagen maar nog niet verwerkt." } }, { status: 500 });
  }
}
