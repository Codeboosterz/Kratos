import { createHash } from "node:crypto";
import {
  calendlyAppointmentRow,
  normalizeCalendlyWebhook,
  verifyCalendlyWebhookSignature,
} from "@/src/operations/calendly";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { createAdminClient } from "@/src/supabase/admin";

export async function POST(request: Request) {
  const signature = request.headers.get("calendly-webhook-signature");
  if (!signature) return Response.json({ error: { code: "INVALID_INPUT", message: "Calendly-handtekening ontbreekt." } }, { status: 400 });

  const rawBody = await request.text();
  const signingKey = await resolveIntegrationSecret("calendly", "webhook_signing_key").catch(() => null);
  if (!signingKey) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Calendly-webhook is niet geconfigureerd." } }, { status: 503 });
  if (!verifyCalendlyWebhookSignature({ body: rawBody, header: signature, secret: signingKey })) {
    return Response.json({ error: { code: "INVALID_SIGNATURE", message: "Ongeldige Calendly-handtekening." } }, { status: 400 });
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); }
  catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldige webhookinhoud." } }, { status: 400 }); }
  const appointment = normalizeCalendlyWebhook(payload);
  if (!appointment) return Response.json({ received: true, ignored: true });

  const eventType = (payload as { event: string }).event;
  const providerEventId = `${eventType}:${appointment.providerInviteeUri}`;
  const payloadHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  let admin;
  try { admin = createAdminClient(); }
  catch { return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Afspraakopslag ontbreekt." } }, { status: 503 }); }

  const { error: eventError } = await admin.from("provider_webhook_events").insert({
    provider: "calendly",
    provider_event_id: providerEventId,
    event_type: eventType,
    status: "processing",
    attempts: 1,
    payload_hash: payloadHash,
  });
  if (eventError?.code === "23505") {
    const { data: existing } = await admin.from("provider_webhook_events").select("status, attempts").eq("provider", "calendly").eq("provider_event_id", providerEventId).maybeSingle();
    if (existing?.status === "completed" || existing?.status === "processing") return Response.json({ received: true, duplicate: true });
    await admin.from("provider_webhook_events").update({ status: "processing", attempts: (existing?.attempts ?? 0) + 1, last_error: null }).eq("provider", "calendly").eq("provider_event_id", providerEventId);
  } else if (eventError) {
    return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet duurzaam worden geregistreerd." } }, { status: 503 });
  }

  try {
    const { error: appointmentError } = await admin.from("calendar_appointments").upsert(
      calendlyAppointmentRow(appointment),
      { onConflict: "provider_invitee_uri" },
    );
    if (appointmentError) throw new Error(appointmentError.message);

    if (appointment.intakeReference) {
      await admin.from("intake_requests").update({ appointment_status: appointment.status, updated_at: new Date().toISOString() }).eq("reference", appointment.intakeReference);
    }
    await admin.from("provider_webhook_events").update({ status: "completed", processed_at: new Date().toISOString() }).eq("provider", "calendly").eq("provider_event_id", providerEventId);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1_000) : "Calendly-sync mislukt.";
    await admin.from("provider_webhook_events").update({ status: "failed", last_error: message }).eq("provider", "calendly").eq("provider_event_id", providerEventId);
    return Response.json({ error: { code: "SYNC_FAILED", message: "De afspraak kon niet veilig worden gesynchroniseerd." } }, { status: 500 });
  }
}
