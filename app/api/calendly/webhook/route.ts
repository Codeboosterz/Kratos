import { createHash } from "node:crypto";
import {
  calendlyAppointmentRow,
  normalizeCalendlyWebhook,
  verifyCalendlyWebhookSignature,
} from "@/src/operations/calendly";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { createAdminClient } from "@/src/supabase/admin";
import { assertPersisted, claimWebhookEvent, finishWebhookEvent } from "@/src/operations/webhook-events";

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

  const key = { provider: "calendly" as const, provider_event_id: providerEventId };
  let attempt: number;
  try {
    const claim = await claimWebhookEvent(admin, { ...key, event_type: eventType, payload_hash: payloadHash });
    if (claim.state === "duplicate") return Response.json({ received: true, duplicate: true });
    if (claim.state === "busy") return Response.json({ error: { code: "RETRY_LATER", message: "Webhook wordt nog verwerkt." } }, { status: 503 });
    attempt = claim.attempt;
  } catch { return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet duurzaam worden geregistreerd." } }, { status: 503 }); }

  try {
    const { error: appointmentError } = await admin.from("calendar_appointments").upsert(
      calendlyAppointmentRow(appointment),
      { onConflict: "provider_invitee_uri" },
    );
    if (appointmentError) throw new Error(appointmentError.message);

    if (appointment.intakeReference) {
      assertPersisted(await admin.from("intake_requests").update({ appointment_status: appointment.status, updated_at: new Date().toISOString() }).eq("reference", appointment.intakeReference), "Intake kon niet aan de afspraak worden gekoppeld.");
    }
    await finishWebhookEvent(admin, key, attempt, "completed");
    return Response.json({ received: true });
  } catch {
    await finishWebhookEvent(admin, key, attempt, "failed").catch(() => undefined);
    return Response.json({ error: { code: "SYNC_FAILED", message: "De afspraak kon niet veilig worden gesynchroniseerd." } }, { status: 500 });
  }
}
