# Unit 04: Unscheduled Intake Visibility

## Goal

Prevent local demo submissions from being mistaken for live appointments and
surface real stored intakes that are still waiting for a Calendly date inside
the CMS calendar.

## Source of Truth

- User screenshots from 2026-08-30: local fixture intake confirmation beside the live CMS calendar.
- Existing architecture: Calendly is optional and remains the appointment source of truth.
- Existing files: `app/api/intake/route.ts`, `components/intake-form.tsx`, and `app/beheer/(protected)/afspraken/page.tsx`.

## Scope

- Label fixture submissions as local demos that do not enter the live CMS.
- Show `awaiting_booking` intakes as a visible “Wacht op datum” queue in the calendar sidebar.
- Link each queued intake to its CMS lead detail.
- Keep dated calendar cells limited to real `calendar_appointments` records.

## Out of Scope

- Creating fake dated appointments.
- Native availability or double-booking logic before Calendly is configured.
- Applying production migrations, configuring Calendly, or deploying.

## Design

- Preserve the existing carbon/lime language.
- Use an amber information treatment for local demo state.
- Clearly distinguish “intake received” from “appointment booked.”

## Architecture

- `/api/intake` already returns `demo: true` in fixture mode; the client must render it.
- `/beheer/afspraken` reads real pending intakes and real appointments separately.
- No schema change is required.

## Implementation Plan

1. Add failing tests for demo labeling and pending-intake visibility.
2. Render the demo boundary in public step 4.
3. Replace the calendar’s count-only waiting query with a protected queue.
4. Run targeted and full validation, then visually inspect the preview.

## Files to Create or Modify

- `components/intake-form.tsx` — demo state and copy.
- `app/beheer/(protected)/afspraken/page.tsx` — pending intake queue.
- `app/globals.css` — surgical queue/demo styling.
- `tests/e2e/site.spec.ts` — demo boundary acceptance check.
- `tests/unit/cms-intake-calendar-ui.test.ts` — pending queue contract.

## Dependencies

- None.

## Verification Checklist

- [x] Local fixture confirmation explicitly says it is not in the live CMS.
- [x] Pending real intakes are visible in the calendar sidebar.
- [x] Pending items do not appear as fake dated appointments.
- [x] Unit, E2E, lint, typecheck, and build pass.
- [x] Local preview behavior is verified by the Chromium intake acceptance test; interactive re-opening was blocked by the in-app browser's loopback URL policy.
