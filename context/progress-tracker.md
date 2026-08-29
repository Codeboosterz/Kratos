# Progress Tracker

## Current Phase

- Live release complete

## Current Goal

- Keep the validated Kratos application stable while provider setup remains pending.

## Completed

- Existing intake, Calendly, Resend, Supabase, and CMS flow audited.
- Implementation plan approved by the user.
- Unit 01 complete: lead workflow migration, typed status schema, owner mutation boundary, source attribution, and canceled-event reconciliation.
- Unit 02 complete: four-stage public intake, safe session recovery, accessible step transitions, authoritative submission, and optional Calendly/fallback states.
- Unit 03 complete: intake-first CMS inbox, workflow actions, Resend conversation handoff, searchable month/agenda calendar, and intake/appointment deep links.
- Unit 04 complete: local fixture submissions are explicitly labeled and real intakes without a booked date are shown in the calendar's `Wacht op datum` queue.
- Unit 05 complete: four CMS dashboard percentages now use one accessible server-rendered SVG ring, the public Faith & Fitness rail remains unchanged, and the application release was deployed from commit `cf1397b`.

## In Progress

- None.

## Next Up

- Apply the Supabase migration and provider credentials later when explicitly requested.

## Open Questions

- Calendly API credentials will be supplied later by the client; integration remains optional.

## Architecture Decisions

- 2026-08-30: Keep Calendly as appointment source of truth; no local drag/drop mutation.
- 2026-08-30: Keep intake records distinct from Resend email threads.
- 2026-08-30: Default PII access to owner/super-admin membership.
- 2026-08-30: A submitted intake without a provider-confirmed date is a queue item, not a calendar appointment.
- 2026-08-30: CMS percentage indicators share one server-rendered SVG primitive; public scroll-story progress remains separate.

## Validation History

- `npm test -- tests/unit/intake.test.ts tests/unit/intake-lead-workflow.test.ts` — 7 tests passed.
- `npm run typecheck` — passed after Unit 01.
- `npx playwright test tests/e2e/site.spec.ts --grep "intake validates"` — public intake browser flow passed.
- `npm test -- tests/unit/cms-intake-calendar-ui.test.ts tests/unit/intake.test.ts tests/unit/intake-lead-workflow.test.ts` — 10 tests passed.
- `npm run typecheck` — passed after Units 02–03.
- `npm test` — 69 tests passed across 23 files.
- `npm run lint` — passed.
- `npm run build` — passed; all public and CMS routes compiled.
- `npm run test:e2e` — 19 browser tests passed, including the intake flow, responsive behavior, and serious/critical accessibility checks.
- `npm test -- tests/unit/cms-intake-calendar-ui.test.ts` — 3 corrective calendar UI tests passed.
- `npx playwright test tests/e2e/site.spec.ts --grep "intake validates"` — corrected local demo boundary passed in Chromium.
- `npm test` — 69 tests passed across 23 files after Unit 04.
- `npm run lint`, `npm run typecheck`, and `npm run build` — passed after Unit 04.
- `npm run test:e2e` — all 19 browser tests passed after Unit 04.
- `npm test -- tests/unit/cms-progress-ring.test.ts` — 3 progress-ring TDD contracts passed.
- `npm test` — 72 tests passed across 24 files after Unit 05.
- `npm run lint`, `npm run typecheck`, and `npm run build` — passed after Unit 05.
- `npm run test:e2e` — all 19 browser tests passed; the public Faith & Fitness rail remained synchronized.
- Vercel production deployment for commit `cf1397b` — completed successfully.
- Authenticated production CMS inspection — four SVG progress bars rendered with values 11%, 0%, 20%, and 20%; no browser warnings or errors were recorded.

## Preview History

- Local fixture preview: `http://127.0.0.1:3200/intake?product=transformatie-pack-10-sessies&source=product-detail`.
- Desktop steps 1/4 and mobile step 2 visually inspected in `artifacts/qa/`.
- Unit 04's local intake confirmation was verified through its Chromium acceptance test; the in-app browser declined the loopback URL during the final interactive re-open.
- Unit 05 preview started at `http://127.0.0.1:3200`; `/` returned 200 and the protected CMS correctly redirected to configuration/login locally.
- Production CMS visual verification completed at `https://kratosfitness.be/beheer`; three 74px compact rings and one 148px readiness ring rendered from live CMS data.

## Session Notes

- Preserve all pre-existing dirty public media and unrelated application files.
