import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const calendlyWebhookSchema = z.object({
  event: z.enum(["invitee.created", "invitee.canceled"]),
  created_at: z.iso.datetime(),
  payload: z.object({
    uri: z.url(),
    event: z.url(),
    email: z.email(),
    name: z.string().trim().min(1).max(200),
    status: z.enum(["active", "canceled"]),
    timezone: z.string().trim().min(1).max(100).default("Europe/Brussels"),
    cancel_url: z.url().nullish(),
    reschedule_url: z.url().nullish(),
    tracking: z.object({ utm_campaign: z.string().nullish() }).nullish(),
    scheduled_event: z.object({
      name: z.string().trim().min(1).max(240),
      start_time: z.iso.datetime(),
      end_time: z.iso.datetime(),
      event_type: z.url().nullish(),
      location: z.object({
        type: z.string().trim().max(80).nullish(),
        location: z.string().trim().max(500).nullish(),
        join_url: z.url().nullish(),
      }).nullish(),
    }),
  }),
});

const intakeReferencePattern = /^KRA-[A-Z0-9-]{4,40}$/;

function parseSignatureHeader(header: string) {
  const values = new Map(header.split(",").map((part) => {
    const [key, ...rest] = part.trim().split("=");
    return [key, rest.join("=")];
  }));
  return { timestamp: values.get("t"), signature: values.get("v1") };
}

export function verifyCalendlyWebhookSignature(input: {
  body: string;
  header: string;
  secret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}) {
  const { timestamp, signature } = parseSignatureHeader(input.header);
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const receivedAt = Number(timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1_000);
  if (Math.abs(now - receivedAt) > (input.toleranceSeconds ?? 180)) return false;

  const expected = createHmac("sha256", input.secret).update(`${timestamp}.${input.body}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

export type CalendlyAppointment = {
  providerEventUri: string;
  providerInviteeUri: string;
  eventTypeUri: string | null;
  eventName: string;
  inviteeName: string;
  inviteeEmail: string;
  status: "scheduled" | "canceled";
  startTime: string;
  endTime: string;
  timezone: string;
  location: string | null;
  cancelUrl: string | null;
  rescheduleUrl: string | null;
  intakeReference: string | null;
  providerCreatedAt: string;
};

export function calendlyAppointmentRow(appointment: CalendlyAppointment) {
  return {
    provider_event_uri: appointment.providerEventUri,
    provider_invitee_uri: appointment.providerInviteeUri,
    event_type_uri: appointment.eventTypeUri,
    event_name: appointment.eventName,
    invitee_name: appointment.inviteeName,
    invitee_email: appointment.inviteeEmail,
    status: appointment.status,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    timezone: appointment.timezone,
    location: appointment.location,
    cancel_url: appointment.cancelUrl,
    reschedule_url: appointment.rescheduleUrl,
    intake_reference: appointment.intakeReference,
    provider_created_at: appointment.providerCreatedAt,
    updated_at: new Date().toISOString(),
  };
}

export function normalizeCalendlyWebhook(value: unknown): CalendlyAppointment | null {
  const parsed = calendlyWebhookSchema.safeParse(value);
  if (!parsed.success) return null;

  const { event, created_at: providerCreatedAt, payload } = parsed.data;
  const reference = payload.tracking?.utm_campaign?.toUpperCase() ?? null;
  const location = payload.scheduled_event.location;

  return {
    providerEventUri: payload.event,
    providerInviteeUri: payload.uri,
    eventTypeUri: payload.scheduled_event.event_type ?? null,
    eventName: payload.scheduled_event.name,
    inviteeName: payload.name,
    inviteeEmail: payload.email.toLowerCase(),
    status: event === "invitee.canceled" || payload.status === "canceled" ? "canceled" : "scheduled",
    startTime: payload.scheduled_event.start_time,
    endTime: payload.scheduled_event.end_time,
    timezone: payload.timezone,
    location: location?.join_url ?? location?.location ?? location?.type ?? null,
    cancelUrl: payload.cancel_url ?? null,
    rescheduleUrl: payload.reschedule_url ?? null,
    intakeReference: reference && intakeReferencePattern.test(reference) ? reference : null,
    providerCreatedAt,
  };
}

export function buildCalendlyEmbedUrl(schedulingUrl: string, invitee: { name: string; email: string; reference: string }) {
  const url = new URL(schedulingUrl);
  if (url.protocol !== "https:" || (url.hostname !== "calendly.com" && !url.hostname.endsWith(".calendly.com"))) {
    throw new Error("De Calendly-planningslink is niet geldig.");
  }
  url.searchParams.set("name", invitee.name);
  url.searchParams.set("email", invitee.email);
  url.searchParams.set("utm_source", "kratos");
  url.searchParams.set("utm_medium", "intake");
  url.searchParams.set("utm_campaign", invitee.reference);
  return url.toString();
}
