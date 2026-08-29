# Unit 03: CMS Intake Inbox and Calendar

## Goal

Give the owner one operational view for structured intakes and linked Calendly
appointments while preserving the existing Resend inbox.

## Scope

- Inbox tabs for Intakes and E-mail.
- Lead list/detail, filters, unread/status markers, internal note, and contact actions.
- Linked appointment summary and calendar deep-link.
- Calendar month/list views, status/search filters, and event detail panel.
- Responsive agenda-first mobile presentation.

## Out of Scope

- Drag/drop appointment mutation.
- Replacing Calendly availability or booking ownership.

## Design

Use the existing CMS shell and tokens. Adapt the 21st.dev Event Manager density
and view switcher without copying its data mutation behavior.

## Verification Checklist

- [x] CMS workflow tests written first
- [x] Intakes and email remain separate data domains
- [x] Workflow updates require owner/super-admin authorization
- [x] Appointment and intake cross-links work
- [x] Empty/error/mobile states are usable
- [x] Relevant tests and visual inspection pass
