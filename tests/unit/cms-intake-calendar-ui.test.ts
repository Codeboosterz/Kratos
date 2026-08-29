import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const inboxPage = readFileSync(resolve(process.cwd(), "app/beheer/(protected)/inbox/page.tsx"), "utf8");
const inboxActions = readFileSync(resolve(process.cwd(), "app/beheer/(protected)/inbox/actions.ts"), "utf8");
const calendarPage = readFileSync(resolve(process.cwd(), "app/beheer/(protected)/afspraken/page.tsx"), "utf8");

describe("CMS intake and calendar workflow UI", () => {
  it("makes intake leads the primary inbox view with workflow and appointment context", () => {
    expect(inboxPage).toContain('view?: "intakes" | "email"');
    expect(inboxPage).toContain('from("intake_requests")');
    expect(inboxPage).toContain("intakeLeadStatusLabels");
    expect(inboxPage).toContain("updateIntakeLead");
    expect(inboxPage).toContain("/beheer/afspraken?appointment=");
  });

  it("can start a Resend conversation directly from an intake", () => {
    expect(inboxActions).toContain("export async function replyToIntakeLead");
    expect(inboxActions).toContain('action: "intake.email_started"');
  });

  it("offers searchable month and agenda calendar views with event deep links", () => {
    expect(calendarPage).toContain('view?: "month" | "agenda"');
    expect(calendarPage).toContain('name="query"');
    expect(calendarPage).toContain("appointment.id === selectedAppointmentId");
    expect(calendarPage).toContain("cms-calendar-agenda");
    expect(calendarPage).toContain("/beheer/inbox?view=intakes&intake=");
    expect(calendarPage).toContain("cms-calendar-waiting");
    expect(calendarPage).toContain("Wacht op datum");
    expect(calendarPage).toContain("customer_name, customer_email, reference, created_at");
  });
});
