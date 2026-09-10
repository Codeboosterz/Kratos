# Progress Tracker

## Current Phase

- Client handover preparation; Units 19–26 audit/repairs validated, release verification next

## Current Goal

- 11 September: Unit 19 smoke/security/form/CTA audit complete. Repair Units
  20–26 pass 223 tests, 30 browser checks, lint/typecheck/build and zero-advisory
  npm audit. See `production-smoke-audit-2026-09-11.md`. Release verification is
  pending; baseline is `3537abe`. Preserve existing dirty files. No real charges, emails,
  bookings, credential changes or production schema writes during QA.
- Briefing automation updated to Saturday 12 September 2026 at 10:00
  Europe/Brussels, one occurrence. Prior 8 September prompt is superseded.

- Unit 18 complete: commit `3537abe` is live on `kratosfitness.be`; Vercel
  deployment `dpl_Ee7AUjwgEtBmeUM9gvrUmXFWq4Nk` is READY (54-second build).
  User-saved `SUPABASE_SECRET_KEY` is Secret/Production-only. The live form,
  Supabase row, CMS Inbox and calendar waiting queue all show QA reference
  `KRA-26-DD450D88`. Exactly one labeled synthetic record is retained; no
  appointment, email, payment, new migration or price change was made.
- Units 13–17 and the test-only resize synchronization fix are deployed.
  All 163 unit/integration tests, 30 browser tests, lint, TypeScript and
  production build pass. Eight live detail/checkout route checks pass.
- Unit 14 checkout code is deployed, with all package prices unchanged.
  Purchase activation still needs valid live Stripe credentials and CMS price
  mappings. The port-3200 preview now runs the production build without fixtures.

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
- Unit 12 complete: Units 10–11 released in commit `9bd0b17`, verified through
  Vercel's successful GitHub deployment status and the live domain. Next Faith
  story checked without code changes; no functional animation defect found.
- Unit 13 audit and local safety fixes complete: Stripe input types, credential
  validation, consistent checkout configuration checks, environment/Vault source
  warnings and non-secret health errors. Resend setup and end-to-end wiring gaps
  documented in `feature-specs/13-cms-provider-wiring-audit.md`. Not deployed.
- Unit 14 implementation complete locally: CMS-owned purchase readiness, exact
  Stripe price/quote validation, live-mode/HTTPS guards, safe session retry,
  buyer email and final amount, one checkout header, owner-save invalidation.
  See `feature-specs/14-live-checkout-readiness.md`. No prices changed or deployment.
- Unit 15 local intake hardening: durable rate limiter, stable insert-only retries,
  safe database failure and source attribution. Rollback-only production access
  checks pass; no migration or persistent customer data written.
- Unit 16 local routing: every package's hero and final start CTA opens the matching
  checkout, including legacy external-mode products. Eight-package traversal passes;
  authoritative payment guards and all prices remain unchanged.
- Unit 17 local community: `/community` replaces public tools, with a 308 legacy
  redirect, shared navigation and customer-photo layout. Existing CMS record/history
  retained; legacy reads merge new defaults and owner publication invalidates routes.

## In Progress

- Unit 20 complete locally: Next 16.3.4 and transitive security patches;
  full npm audit reports zero known advisories. Final browser suite 30/30.
- Unit 21 complete locally: Media source restored, publication ownership and
  invalidation repaired, zero-row lead updates rejected. 13 focused tests pass.
- Unit 22 complete locally: checked persistence and safe retry handling for
  Resend/Calendly and CMS replies; 15 mocked-provider tests/typecheck pass.
- Unit 23 complete locally: missing PDF targets rejected, checked AI/storage
  writes, recoverable inputs/loading states. 196 tests, typecheck and lint pass.
- Units 24–25 complete locally: one product purchase CTA, no coach-promo detour,
  filtered Inbox pagination/deep links. 206 tests and all 30 browser tests pass.
  Community resize timing stabilized in the test only; animation unchanged.
- Unit 26 complete locally: preserves access tokens/orders/provisioning state
  on replay; checked persistence and paid-order recovery guards. 17 new tests
  pass (14 reproduced failures before implementation). Full suite 223/223.

- Unit 15 live intake capture is verified. Retained QA is labeled not to contact;
  it is evidence of intake storage, not a booking or email test.
- Unit 17 community group destination is not yet supplied. `Ik heb interesse`
  uses `/intake?source=community`; it is not a membership or booking flow.
- Unit 14 live activation is blocked: read-only production query confirms eight
  draft products with null prices/Stripe price IDs. They remain unchanged. A real
  provider round trip and signed webhook/fulfillment acceptance are still needed.
- Provider activation remains blocked by client setup. The photographed Stripe
  key returned 401 during a read-only check and was not saved; existing production
  environment credentials were not replaced. Publishable key is still missing
  on production, as is `NEXT_PUBLIC_SITE_URL` (required canonical HTTPS origin for
  live checkout). Resend account and DNS access are not ready (confirmed by user).
- Unit 09 product-content and final visual work remains outstanding, alongside
  Calendly credentials and final handover acceptance.
- Browser release gate resolved in Unit 18: trace evidence showed stale resize
  geometry. Test synchronization now waits for refreshed measurements; all 30
  browser tests pass without changing homepage animation behavior.

## Next Up

- Intake activation/release acceptance is complete. Keep the QA record labeled;
  remove it only after explicit cleanup approval.
- Configure approved CMS commerce prices/IDs and valid live keys securely, then
  verify account/mode, webhook and fulfillment before activating live purchases.
  Product CTA wiring, structured-content invalidation and webhook retry/error
  handling are repaired and validated locally; release acceptance remains.
- Prepare automatic new-intake business notifications separately from CMS intake
  storage; this notification path does not exist yet.
- Client supplies a Resend account/DNS access, valid Stripe live credentials and
  price mappings, and Calendly access. Verify approved provider round trips before
  activation. No live charges or customer emails for testing.
- Complete package-specific CMS detail content, remove product coach biography,
  polish typography/animations/responsiveness, and run scoped release checks.

## Open Questions

- Calendly API credentials will be supplied later by the client; integration remains optional.
- The user supplied 12 community images and confirmed the homepage community
  grid as the destination. Two previously supplied coaching images fill the
  remaining surrounding slots; no further images are required for this grid.
- Confirm package inclusions from source material; do not invent entitlements.
- Supabase leaked-password protection is disabled; review account hardening
  before handover. Three existing guarded CMS RPC advisor warnings were reviewed.
- Vercel runtime logs now work through the CLI: the new deployment records
  `intake_created` for the QA reference, and the 15-minute error scan is empty.
  This is a bounded smoke check, not continuous monitoring; drains were not checked.
- Confirm canonical public/business contact: the user supplied
  `Kratosfitness2025@gmail.com`, while contact/privacy defaults use Outlook.
  Do not silently replace public details or treat the supplied address as an
  existing CMS owner account. Review privacy copy against actual data storage.

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

- Unit 18 release: 163 tests, lint and TypeScript rerun successfully. Earlier
  same-code preflight passed all 30 browser tests and 48-page production build.
  Commit `3537abe` pushed without force; Vercel production READY and live domain
  alias verified. All eight package detail/checkout routes return 200 with two
  matching checkout CTAs each; purchase guards remain active. `/community` is 200,
  `/gratis-tools` redirects 308, and unauthenticated CMS redirects to login.
- Live QA: `KRA-26-DD450D88`, row `857d94e3-8314-442f-9b20-d278f71b2747`,
  source `about-final`, status `new`, appointment status `awaiting_booking`.
  Public step 4, authenticated CMS and calendar waiting queue agree. Database
  counts: one matching intake, zero linked appointments, zero QA email threads.
  Intake browser console is clean; Vercel logs confirm the intake-created event.
- Supabase advisory recheck: existing three authenticated security-definer CMS
  RPC warnings and disabled leaked-password protection remain; no RLS or auth
  setting changes in this release. See Unit 18 for remediation references.
- Units 15–17: 163 unit/integration tests across 40 files, lint, typecheck,
  production build (48 pages) and diff whitespace checks pass. Latest browser
  run: 29/30 pass, including all
  eight package routes, intake error/reload/same-key recovery, community CMS
  source/redirect/mobile checks and serious/critical accessibility checks.
  The unchanged homepage resize test remains a full-suite failure; isolated
  repeat passed 2/2. Do not describe the whole browser suite as passing.
- Production intake rollback-only assertions pass for defaults, constraints,
  owner read/update, non-owner denial and anonymous denial. Row count is zero
  after rollback; no lead, appointment, email or payment was created.
- Unit 14: 134 unit/integration tests across 36 files, all 28 browser tests,
  typecheck, lint and production build (47 pages) passed. Malformed generated dev
  types were backed up and regenerated; no app workaround. Non-fixture checkout
  returns an honest unavailable state/API 503; no payment/provider writes.
- Checkout-availability follow-up: seven Stripe configuration/API regression
  checks and the fixture checkout browser acceptance test passed. No application
  source changes; only the local preview runtime was switched to explicit demo
  mode. Production protections, product records and credentials are unchanged.
- Unit 13: typecheck, lint, 95 unit/integration tests across 31 files and production
  build (47 pages) passed. Initial browser run passed 26/27; unchanged community
  resize test passed alone, and the complete two-worker rerun passed all 27.
  No animation code/test changes. Production intake/RLS rollback-only assertions
  passed; no synthetic records remain. No new migration or provider writes.
- Unit 12 release gate: typecheck, lint, 82 unit tests, production build
  (47 pages) and all 27 browser tests passed. The next Faith story's six
  chapters, mobile flow, reduced motion and community handoff remain correct.
- Unit 12 production deployment `dpl_ExjBTCJKx9uEPzy6fG8Hx9ofA8v4` completed
  at 10:01:36 UTC. Live homepage returned 200; all 15 community and six Faith
  images loaded. New scene/growth confirmed, normal section release verified,
  and no horizontal overflow observed. Runtime logs returned 403 (not verified).
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

- Units 15–17: `http://127.0.0.1:3200/community` inspected on desktop and 375px;
  three approved photos load and interest/navigation controls are visible.
  Local intake and Duo detail-to-checkout route inspected. Preview uses a
  non-fixture production build: unavailable commerce is shown honestly, not as
  a simulated enabled live payment. New CMS save/publish contracts tested with
  mocks; no real owner revision was published during QA.
- Unit 14 current: production build at
  `http://127.0.0.1:3200/checkout/transformatie-pack-10-sessies`, fixtures off.
  Desktop and 375px layout inspected: one header/main, no demo or pay button while
  unconfigured, no horizontal overflow or page errors. Prior demo preview replaced.
- Checkout availability: local server restarted with `KRATOS_FIXTURE_MODE=true`
  at `http://127.0.0.1:3200/checkout/transformatie-pack-10-sessies`. Browser shows
  "Veilige demonstratie", "Testbedrag — geen productieprijs" and an enabled
  "Start veilige demo" button. Synthetic checkout confirmation passed the browser
  test; this is not a Stripe test transaction or real purchasing. The fixture
  flag is ignored in production and no persistent environment file was changed.
- Unit 13: non-fixture local checkout checked in-browser at
  `http://127.0.0.1:3200/checkout/transformatie-pack-10-sessies`. Configuration
  warning and disabled purchasing verified. Updated protected settings need a
  configured local login for visual verification; live settings inspected read-only.
- Unit 12: local chapter 3 inspected at 2013×1604, then live community finale,
  Faith chapters 1 and 6 and final release inspected at `https://kratosfitness.be/`.
  Live screenshots were viewed inline. Fixture server restarted and available
  at `http://127.0.0.1:3200/`. No production forms were submitted.
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
- Community photos and reveal finale are published in `9bd0b17`.
  Calendly verification, product-specific CMS content, removing the
  product Omar promo, and final visual polish remain pending for Unit 09.
- 2026-09-08 Unit 13: no credentials were saved, no live payments or customer
  emails were created, and no application changes were deployed. Shared Stripe
  key must be rotated; use test-mode keys for payment acceptance testing. Email
  integration guidance was used to document sender-domain verification and the
  separate inbound reply/webhook setup without changing account or DNS settings.
