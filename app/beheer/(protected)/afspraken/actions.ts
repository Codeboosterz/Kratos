"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCmsMembership } from "@/src/cms/auth";
import { calendlyAppointmentRow } from "@/src/operations/calendly";
import { ensureCalendlyWebhookSubscription, listCalendlyAppointments } from "@/src/operations/calendly-api";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { trustedSiteOrigin } from "@/src/server/environment";
import { createAdminClient } from "@/src/supabase/admin";

function resultUrl(status: string, count?: number) {
  const query = new URLSearchParams({ status });
  if (count != null) query.set("count", String(count));
  return `/beheer/afspraken?${query}`;
}

export async function syncCalendlyAppointments() {
  const { membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect(resultUrl("owner-required"));

  const [accessToken, signingKey] = await Promise.all([
    resolveIntegrationSecret("calendly", "access_token").catch(() => null),
    resolveIntegrationSecret("calendly", "webhook_signing_key").catch(() => null),
  ]);
  if (!accessToken || !signingKey || !trustedSiteOrigin) redirect(resultUrl("configuration-required"));

  let syncedCount = 0;
  try {
    await ensureCalendlyWebhookSubscription({
      accessToken,
      signingKey,
      callbackUrl: `${trustedSiteOrigin}/api/calendly/webhook`,
    });
    const now = new Date();
    const rangeStart = new Date(now.getTime() - 120 * 24 * 60 * 60_000).toISOString();
    const rangeEnd = new Date(now.getTime() + 550 * 24 * 60 * 60_000).toISOString();
    const appointments = await listCalendlyAppointments({ accessToken, rangeStart, rangeEnd });
    syncedCount = appointments.length;
    const admin = createAdminClient();
    if (appointments.length) {
      const { error } = await admin.from("calendar_appointments").upsert(
        appointments.map(calendlyAppointmentRow),
        { onConflict: "provider_invitee_uri" },
      );
      if (error) throw new Error(error.message);
      const statusByReference = new Map<string, "scheduled" | "canceled">();
      for (const appointment of appointments) {
        if (!appointment.intakeReference) continue;
        const current = statusByReference.get(appointment.intakeReference);
        if (appointment.status === "scheduled" || !current) statusByReference.set(appointment.intakeReference, appointment.status);
      }
      for (const [reference, appointmentStatus] of statusByReference) {
        await admin.from("intake_requests").update({ appointment_status: appointmentStatus, updated_at: new Date().toISOString() }).eq("reference", reference);
      }
    }
    await admin.from("integration_connections").update({ status: "connected", last_checked_at: new Date().toISOString(), last_error: null }).eq("provider", "calendly");
    revalidatePath("/beheer");
    revalidatePath("/beheer/afspraken");
    revalidatePath("/beheer/instellingen");
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Calendly-sync mislukt.";
    try {
      const admin = createAdminClient();
      await admin.from("integration_connections").update({ status: "degraded", last_checked_at: new Date().toISOString(), last_error: message }).eq("provider", "calendly");
    } catch { /* The visible redirect below is the safe fallback. */ }
    redirect(resultUrl("sync-failed"));
  }
  redirect(resultUrl("synced", syncedCount));
}
