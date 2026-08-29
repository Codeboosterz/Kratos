import "server-only";

import { z } from "zod";
import type { CalendlyAppointment } from "@/src/operations/calendly";

const apiBase = "https://api.calendly.com";

const calendlyUserSchema = z.object({
  resource: z.object({
    uri: z.url(),
    current_organization: z.url(),
    scheduling_url: z.url(),
  }),
});

const scheduledEventSchema = z.object({
  uri: z.url(),
  name: z.string(),
  status: z.string(),
  start_time: z.iso.datetime(),
  end_time: z.iso.datetime(),
  event_type: z.url().nullish(),
  location: z.object({
    type: z.string().nullish(),
    location: z.string().nullish(),
    join_url: z.url().nullish(),
  }).nullish(),
});

const inviteeSchema = z.object({
  uri: z.url(),
  email: z.email(),
  name: z.string(),
  status: z.string(),
  timezone: z.string().default("Europe/Brussels"),
  cancel_url: z.url().nullish(),
  reschedule_url: z.url().nullish(),
  created_at: z.iso.datetime(),
  tracking: z.object({ utm_campaign: z.string().nullish() }).nullish(),
});

const collectionSchema = z.object({
  collection: z.array(z.unknown()),
  pagination: z.object({ next_page: z.url().nullish() }).default({ next_page: null }),
});

async function calendlyFetch(url: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Calendly antwoordde met ${response.status}${message ? `: ${message.slice(0, 240)}` : "."}`);
  }
  return response.status === 204 ? null : response.json();
}

export async function getCalendlyUser(accessToken: string) {
  return calendlyUserSchema.parse(await calendlyFetch(`${apiBase}/users/me`, accessToken)).resource;
}

async function collectPages(url: string, accessToken: string, maximumPages = 5) {
  const resources: unknown[] = [];
  let nextPage: string | null = url;
  let pages = 0;
  while (nextPage && pages < maximumPages) {
    const parsed = collectionSchema.parse(await calendlyFetch(nextPage, accessToken));
    resources.push(...parsed.collection);
    nextPage = parsed.pagination.next_page ?? null;
    pages += 1;
  }
  return resources;
}

export async function listCalendlyAppointments(input: { accessToken: string; rangeStart: string; rangeEnd: string }) {
  const user = await getCalendlyUser(input.accessToken);
  const params = new URLSearchParams({
    user: user.uri,
    min_start_time: input.rangeStart,
    max_start_time: input.rangeEnd,
    sort: "start_time:asc",
    count: "100",
  });
  const events = (await collectPages(`${apiBase}/scheduled_events?${params}`, input.accessToken)).map((event) => scheduledEventSchema.parse(event));
  const appointments: CalendlyAppointment[] = [];

  for (const event of events) {
    const invitees = (await collectPages(`${event.uri}/invitees?count=100`, input.accessToken, 2)).map((invitee) => inviteeSchema.parse(invitee));
    for (const invitee of invitees) {
      const reference = invitee.tracking?.utm_campaign?.toUpperCase() ?? null;
      appointments.push({
        providerEventUri: event.uri,
        providerInviteeUri: invitee.uri,
        eventTypeUri: event.event_type ?? null,
        eventName: event.name,
        inviteeName: invitee.name,
        inviteeEmail: invitee.email.toLowerCase(),
        status: invitee.status === "canceled" || event.status === "canceled" ? "canceled" : "scheduled",
        startTime: event.start_time,
        endTime: event.end_time,
        timezone: invitee.timezone,
        location: event.location?.join_url ?? event.location?.location ?? event.location?.type ?? null,
        cancelUrl: invitee.cancel_url ?? null,
        rescheduleUrl: invitee.reschedule_url ?? null,
        intakeReference: reference && /^KRA-[A-Z0-9-]{4,40}$/.test(reference) ? reference : null,
        providerCreatedAt: invitee.created_at,
      });
    }
  }
  return appointments;
}

export async function ensureCalendlyWebhookSubscription(input: { accessToken: string; signingKey: string; callbackUrl: string }) {
  const user = await getCalendlyUser(input.accessToken);
  const params = new URLSearchParams({ organization: user.current_organization, user: user.uri, scope: "user", count: "100" });
  const subscriptions = await collectPages(`${apiBase}/webhook_subscriptions?${params}`, input.accessToken, 2);
  const existing = subscriptions.find((item) => {
    const parsed = z.object({ callback_url: z.url(), state: z.string() }).safeParse(item);
    return parsed.success && parsed.data.callback_url === input.callbackUrl && parsed.data.state === "active";
  });
  if (existing) return { created: false };

  await calendlyFetch(`${apiBase}/webhook_subscriptions`, input.accessToken, {
    method: "POST",
    body: JSON.stringify({
      url: input.callbackUrl,
      events: ["invitee.created", "invitee.canceled"],
      organization: user.current_organization,
      user: user.uri,
      scope: "user",
      signing_key: input.signingKey,
    }),
  });
  return { created: true };
}
