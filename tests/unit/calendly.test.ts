import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildCalendlyEmbedUrl,
  normalizeCalendlyWebhook,
  verifyCalendlyWebhookSignature,
} from "@/src/operations/calendly";

describe("Calendly integration", () => {
  it("accepts a current signed webhook and rejects tampered or stale messages", () => {
    const body = JSON.stringify({ event: "invitee.created" });
    const timestamp = 1_800_000_000;
    const secret = "calendly-signing-secret";
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyCalendlyWebhookSignature({ body, header, secret, nowSeconds: timestamp + 20 })).toBe(true);
    expect(verifyCalendlyWebhookSignature({ body: `${body} `, header, secret, nowSeconds: timestamp + 20 })).toBe(false);
    expect(verifyCalendlyWebhookSignature({ body, header, secret, nowSeconds: timestamp + 400 })).toBe(false);
  });

  it("normalizes a scheduled intake without retaining the raw webhook payload", () => {
    expect(normalizeCalendlyWebhook({
      event: "invitee.created",
      created_at: "2026-08-28T10:00:00.000Z",
      payload: {
        uri: "https://api.calendly.com/scheduled_events/event-1/invitees/invitee-1",
        event: "https://api.calendly.com/scheduled_events/event-1",
        email: "client@example.com",
        name: "Ada Client",
        status: "active",
        timezone: "Europe/Brussels",
        cancel_url: "https://calendly.com/cancellations/one",
        reschedule_url: "https://calendly.com/reschedulings/one",
        tracking: { utm_campaign: "KRA-26-A1B2C3" },
        scheduled_event: {
          name: "Intakegesprek",
          start_time: "2026-09-02T08:00:00.000Z",
          end_time: "2026-09-02T08:30:00.000Z",
          event_type: "https://api.calendly.com/event_types/intake",
          location: { type: "physical", location: "Antwerpen" },
        },
      },
    })).toEqual(expect.objectContaining({
      providerEventUri: "https://api.calendly.com/scheduled_events/event-1",
      providerInviteeUri: "https://api.calendly.com/scheduled_events/event-1/invitees/invitee-1",
      eventName: "Intakegesprek",
      inviteeName: "Ada Client",
      inviteeEmail: "client@example.com",
      status: "scheduled",
      startTime: "2026-09-02T08:00:00.000Z",
      endTime: "2026-09-02T08:30:00.000Z",
      intakeReference: "KRA-26-A1B2C3",
      location: "Antwerpen",
    }));
  });

  it("maps cancellations to the existing invitee URI", () => {
    expect(normalizeCalendlyWebhook({
      event: "invitee.canceled",
      created_at: "2026-08-28T10:00:00.000Z",
      payload: {
        uri: "https://api.calendly.com/scheduled_events/event-1/invitees/invitee-1",
        event: "https://api.calendly.com/scheduled_events/event-1",
        email: "client@example.com",
        name: "Ada Client",
        status: "canceled",
        timezone: "Europe/Brussels",
        scheduled_event: {
          name: "Intakegesprek",
          start_time: "2026-09-02T08:00:00.000Z",
          end_time: "2026-09-02T08:30:00.000Z",
        },
      },
    })?.status).toBe("canceled");
  });

  it("builds a safe, prefilled scheduling URL with the intake reference", () => {
    const result = buildCalendlyEmbedUrl("https://calendly.com/omar/intake", {
      name: "Ada Client",
      email: "client@example.com",
      reference: "KRA-26-A1B2C3",
    });
    const url = new URL(result);

    expect(url.origin).toBe("https://calendly.com");
    expect(url.searchParams.get("name")).toBe("Ada Client");
    expect(url.searchParams.get("email")).toBe("client@example.com");
    expect(url.searchParams.get("utm_source")).toBe("kratos");
    expect(url.searchParams.get("utm_campaign")).toBe("KRA-26-A1B2C3");
    expect(() => buildCalendlyEmbedUrl("https://example.com/fake", {
      name: "Ada Client", email: "client@example.com", reference: "KRA-26-A1B2C3",
    })).toThrow();
  });
});
