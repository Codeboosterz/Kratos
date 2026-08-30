# Progress Tracker

## Current Phase

- Units 06–08 complete and live in production

## Current Goal

- Maintain the verified production release while leaving optional provider and
  database activation work isolated until the client supplies credentials.

## Completed

- Existing intake, Calendly, Resend, Supabase, and CMS flow audited.
- Implementation plan approved by the user.
- Unit 01 complete: lead workflow migration, typed status schema, owner mutation boundary, source attribution, and canceled-event reconciliation.
- Unit 02 complete: four-stage public intake, safe session recovery, accessible step transitions, authoritative submission, and optional Calendly/fallback states.
- Unit 03 complete: intake-first CMS inbox, workflow actions, Resend conversation handoff, searchable month/agenda calendar, and intake/appointment deep links.
- Unit 04 complete: local fixture submissions are explicitly labeled and real intakes without a booked date are shown in the calendar's `Wacht op datum` queue.
- Unit 05 complete: four CMS dashboard percentages now use one accessible server-rendered SVG ring, the public Faith & Fitness rail remains unchanged, and the application release was deployed from commit `cf1397b`.
- Unit 06 complete and deployed: public and CMS phone overflow boundaries, swipe rails,
  form typography, touch targets, the intake first viewport, and repeatable CMS
  editor layouts were refined without data or desktop behavior changes.
- Unit 07 complete and deployed: the legacy Faith story rail was replaced by a
  reusable controlled stepper, desktop cards use larger height-led geometry,
  and the six-chapter GSAP sequence and adjacent pin handoff remain intact.
- Unit 08 complete: scoped release commit `6518a38` was pushed to `origin/main`;
  Vercel deployment `dpl_A8di1A2eVcaCKHHdM2La8QKuuEse` reached `READY` and was
  assigned to `https://kratosfitness.be/`.

## In Progress

- None.

## Next Up

- Configure Calendly or apply the prepared Supabase migration only when the
  client supplies credentials and explicitly requests that provider work.

## Open Questions

- Calendly API credentials will be supplied later by the client; integration remains optional.

## Architecture Decisions

- 2026-08-30: Keep Calendly as appointment source of truth; no local drag/drop mutation.
- 2026-08-30: Keep intake records distinct from Resend email threads.
- 2026-08-30: Default PII access to owner/super-admin membership.
- 2026-08-30: A submitted intake without a provider-confirmed date is a queue item, not a calendar appointment.
- 2026-08-30: CMS percentage indicators share one server-rendered SVG primitive; public scroll-story progress remains separate.
- 2026-08-30: Preserve intentional horizontal rails on mobile but hide their native scrollbars; prevent document-level overflow at the container boundary.
- 2026-08-30: Keep the Faith story stepper controlled by the existing GSAP
  chapter index; it is not a click-to-seek control.
- 2026-08-30: Reuse installed Lucide icons in the stepper and avoid a shadcn
  initializer so the established global Kratos styles are not rewritten.

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
- `npm test -- tests/unit/mobile-responsive.test.ts` — 3 mobile CSS contracts passed after an initial red run.
- `npm test` — 75 tests passed across 25 files after Unit 06.
- `npm run lint` and `npm run typecheck` — passed after Unit 06.
- `npm run build` — passed; all 47 generated pages and dynamic CMS routes compiled.
- `npm run test:e2e` — all 20 browser tests passed, including 320px and 375px mobile contracts.
- `npm test -- tests/unit/faith-stepper.test.ts` — 3 TDD contracts passed after the expected missing-component red run.
- `npm test` — 78 tests passed across 26 files after Unit 07.
- `npm run typecheck` and `npm run lint` — passed after Unit 07.
- `npm run build` — passed; all 47 generated pages and dynamic CMS routes compiled after Unit 07.
- `npx playwright test tests/e2e/faith-story.spec.ts tests/e2e/pinned-handoff.spec.ts` — all 6 focused scroll and pin-handoff tests passed.
- `npm run test:e2e` — all 20 browser tests passed after Unit 07.
- Unit 08 release gate: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run build`, and `npm run test:e2e` all passed immediately before the
  scoped production commit; 78 unit and 20 browser tests passed.
- Release commit `6518a38` pushed to `origin/main` without force; the connected
  Vercel production build completed in 37 seconds with status `READY`.
- Live homepage returned 200 and exposed the new `.faith-story__stepper` markup;
  the unauthenticated CMS route redirected to `/beheer/login` as expected.
- In-browser production inspection recorded zero console errors on desktop,
  mobile homepage, and authenticated mobile CMS views; both mobile documents
  reported equal client and scroll widths with no horizontal overflow.

## Preview History

- Local fixture preview: `http://127.0.0.1:3200/intake?product=transformatie-pack-10-sessies&source=product-detail`.
- Desktop steps 1/4 and mobile step 2 visually inspected in `artifacts/qa/`.
- Unit 04's local intake confirmation was verified through its Chromium acceptance test; the in-app browser declined the loopback URL during the final interactive re-open.
- Unit 05 preview started at `http://127.0.0.1:3200`; `/` returned 200 and the protected CMS correctly redirected to configuration/login locally.
- Production CMS visual verification completed at `https://kratosfitness.be/beheer`; three 74px compact rings and one 148px readiness ring rendered from live CMS data.
- Unit 06 local production preview verified at `http://127.0.0.1:3200`: no
  overflow on representative public routes at phone, tablet, or landscape widths;
  the intake first-step heading begins around 488px in the phone viewport.
- Unit 07 local dev preview verified at `http://127.0.0.1:3200` in a 1754×1604
  viewport: chapter 03 and chapter 06 showed the larger contained active card,
  two/five completed step states respectively, the correct current label, and
  zero horizontal overflow.
- Unit 08 production preview verified at `https://kratosfitness.be/`: the desktop
  hero and new Faith story stepper rendered cleanly, the 375px public and CMS
  layouts had no horizontal overflow, and the authenticated CMS dashboard
  remained usable at the mobile breakpoint.

## Session Notes

- Preserve all pre-existing dirty public media and unrelated application files.
