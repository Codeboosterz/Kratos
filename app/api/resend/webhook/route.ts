import { Resend } from "resend";
import { hashWebhookPayload } from "@/src/operations/stripe-fulfillment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { createAdminClient } from "@/src/supabase/admin";

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
  const { error: eventError } = await admin.from("provider_webhook_events").insert({ provider: "resend", provider_event_id: id, event_type: event.type, status: "processing", attempts: 1, payload_hash: hashWebhookPayload(rawBody) });
  if (eventError?.code === "23505") return Response.json({ received: true, duplicate: true });
  if (eventError) return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet worden opgeslagen." } }, { status: 503 });

  try {
    if (event.type === "email.received") {
      if (!apiKey) throw new Error("Resend API key ontbreekt voor inbound content.");
      const resend = new Resend(apiKey);
      const { data: received, error } = await resend.emails.receiving.get(event.data.email_id);
      if (error || !received) throw new Error(error?.message ?? "Inbound e-mail kon niet worden opgehaald.");
      const { data: existingThread } = await admin.from("email_threads").select("id").eq("customer_email", received.from).in("status", ["open", "waiting"]).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
      let threadId = existingThread?.id;
      if (!threadId) {
        const { data: thread, error: threadError } = await admin.from("email_threads").insert({ customer_email: received.from, subject: received.subject || "Bericht via website", status: "open", last_message_at: new Date().toISOString() }).select("id").single();
        if (threadError || !thread) throw new Error("Inboxthread kon niet worden gemaakt.");
        threadId = thread.id;
      } else await admin.from("email_threads").update({ status: "open", last_message_at: new Date().toISOString() }).eq("id", threadId);
      await admin.from("email_messages").insert({
        thread_id: threadId, provider_message_id: event.data.email_id, direction: "inbound", sender: received.from,
        recipients: received.to, subject: received.subject || "Bericht via website", text_body: received.text ?? null,
        html_body: received.html ?? null, delivery_status: "received",
      });
    } else if (event.type in deliveryStates && "email_id" in event.data) {
      await admin.from("email_messages").update({ delivery_status: deliveryStates[event.type] }).eq("provider_message_id", event.data.email_id);
    }
    await admin.from("provider_webhook_events").update({ status: "completed", processed_at: new Date().toISOString() }).eq("provider", "resend").eq("provider_event_id", id);
    return Response.json({ received: true });
  } catch (error) {
    await admin.from("provider_webhook_events").update({ status: "failed", last_error: error instanceof Error ? error.message.slice(0, 1_000) : "Inboxverwerking mislukt." }).eq("provider", "resend").eq("provider_event_id", id);
    return Response.json({ error: { code: "PROCESSING_FAILED", message: "Webhook is opgeslagen maar nog niet verwerkt." } }, { status: 500 });
  }
}
