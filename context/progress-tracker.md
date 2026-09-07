# Progress Tracker

## Current Phase

- Client handover preparation; Units 06–08 remain live

## Current Goal

- Unit 12: publish the approved community changes and check the following
  Faith & Fitness animation without redesigning it.

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
- Unit 09 preflight complete on 7 September: production intake workflow migration
  applied as remote version `20260907021301`; schema, grants, owner access,
  denial paths, and rollback-only fixture tests verified. One-time briefing scheduled.
- Unit 10 complete locally: all 12 supplied outdoor photos plus two prior
  coaching photos fill 14 surrounding slots, with original centre unchanged.
  CMS custom selections are preserved, exact legacy defaults upgrade on read,
  grid maximum width grows 1.5%, and compact layouts show every photo immediately.
- Unit 11 complete locally: the desktop community scene stays pinned below
  the header through photo reveal, viewport-fit enlargement and final hold,
  then releases normally. Base grid growth is now 2.5%; photos, CMS data,
  compact gallery behavior and the adjacent Faith story remain unchanged.

## In Progress

- Unit 12 release gate, production push and next-animation inspection.
- Unit 09 final build awaits the scheduled 8 September session and Calendly credentials.

## Next Up

- Publish the approved Unit 10–11 allow-list and verify the next animation.
- 8 September at 09:00: obtain Calendly credentials,
  build package-specific CMS detail content, remove product coach biography,
  polish typography/animations/responsiveness, and complete handover checks.

## Open Questions

- Calendly API credentials will be supplied later by the client; integration remains optional.
- The user supplied 12 community images and confirmed the homepage community
  grid as the destination. Two previously supplied coaching images fill the
  remaining surrounding slots; no further images are required for this grid.
- Confirm package inclusions from source material; do not invent entitlements.
- Supabase leaked-password protection is disabled; review account hardening
  before handover. Three existing guarded CMS RPC advisor warnings were reviewed.
- Production runtime-log inspection returned 403; final live verification must
  not assume server-error coverage from the passing local browser tests.

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
- 2026-09-07: Preserve the centre mission image and custom CMS photo selections;
  upgrade only the exact old default grid. Use GSAP matchMedia for the static
  compact gallery and existing desktop reveal, with responsive teardown.
- 2026-09-07: Match the community sticky travel to its actual viewport-height
  layout. Reveal all photos before scaling only the inner composition to the
  limiting viewport dimension; retain native scrolling and safe image margins.

## Validation History

- Unit 12 release gate: typecheck, lint, 82 unit tests, production build
  (47 pages) and all 27 browser tests passed. The next Faith story's six
  chapters, mobile flow, reduced motion and community handoff remain correct.
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
- 7 September preflight: typecheck, lint, 78 unit tests, production build
  (47 generated pages), and all 20 browser tests passed again.
- Production migration: expected missing-column failure reproduced before
  applying the existing migration; subsequent SQL contract/RLS tests passed
  with all synthetic fixture changes rolled back. No appointments/messages created.
- Production deployment `dpl_Chjt7utd6CbXXAi9PKfwSSxgmJVT` verified READY;
  no app deployment this session. Browser QA logged a nonblocking image LCP
  priority warning for `/images/faith/01-prayer.webp`, queued for polish.
- Unit 10: asset/schema tests were written and failed first; compact browser
  visibility tests reproduced the existing defect before the responsive fix.
  Typecheck, lint, 82 unit tests across 27 files, production build (47 pages),
  and all 23 browser tests then passed. Original-byte comparisons passed for
  all 14 photo copies. No horizontal overflow at tested phone/tablet widths.
- Unit 11: the 2.5% contract and new scene test failed before implementation.
  Typecheck, lint, 82 unit tests, production build (47 pages), and all 27
  browser tests passed. Four new tests verify phase ordering, full viewport
  containment, release, reverse, resize/reduced motion and phone cleanup.
  A fixed-delay browser assertion was replaced with rendered-state polling
  before the final passing run; no timing workaround was added to the app.

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
- 7 September: local fixture-mode Duo Coaching page inspected in-browser at
  `http://127.0.0.1:3200/trajecten/duo-coaching`; service image loaded and the
  generic benefits/process/coach block confirmed for tomorrow's focused revision.
- Unit 10 local homepage preview opened at `http://127.0.0.1:3200/` and left
  at the completed community grid. Desktop/375px/800px screenshots are stored in
  `artifacts/qa/community-photos-{desktop,375,800}.png`; all 15 images loaded.
- Unit 11 local preview visually checked at `http://127.0.0.1:3200/` (1280×720)
  and left open at the completed, still-pinned 15-photo composition. Tall,
  standard and short desktop screenshots were also inspected:
  `artifacts/qa/community-finale-{2013,1440,1280}.png`. Not deployed.

## Session Notes

- Preserve all pre-existing dirty public media and unrelated application files.
- 2026-09-07: User authorized the pending migration if safe now and requested
  final visual/product work tomorrow. Automation kratos-client-handover-briefing
  is active for one occurrence at 09:00 Europe/Brussels on 8 September.
- Source migration `20260829223429_intake_lead_workflow.sql` maps to remote
  version `20260907021301`; do not reapply based on a filename mismatch.
- Community photos have been supplied and implemented locally; publication is
  pending. Calendly verification, product-specific CMS content, removing the
  product Omar promo, and final visual polish remain pending for Unit 09.
