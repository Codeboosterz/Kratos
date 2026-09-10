# Kratos production smoke audit — 11 September 2026

## Outcome

The public/CMS code repair pass is validated. The CMS authentication/data
boundaries pass the scoped checks below. Intake capture is connected to the
database and CMS. This is not a penetration-test certificate or a claim that
unconfigured external providers are operational.

Baseline: production commit `3537abe41bd4d4299d4ba07b833ddf41701a2b5f`, Vercel
`dpl_Ee7AUjwgEtBmeUM9gvrUmXFWq4Nk`. Release verification is recorded separately
below after the validated allow-list reaches production.

## Repairs (Units 20–26)

1. Patched Next.js/eslint-config-next 16.3.1 → 16.3.4, sharp → 0.35.4 and
   transitive js-yaml → 4.3.2. No major upgrade; full npm audit: zero advisories.
2. Restored `/beheer/media`: a broad `Media/` ignore rule hid its source route
   from Git on macOS. Anchored the ignore rule to `/Media/`. Did not upload
   unrelated legacy image/source folders exposed by this ignore correction.
3. Explicit publication role guards, homepage revision ownership checks and
   trajectory-detail cache invalidation. Lead changes cannot report success
   when zero rows were saved.
4. Resend/Calendly/Stripe webhooks use durable compare-and-set claims. Busy
   processing returns retryable 503; failed/stale attempts can retry. Message,
   appointment and completion writes are checked before acknowledging success.
5. Resend inbound senders are normalized to replyable addresses. Message saves
   are idempotent and identical outbound retries reuse their provider key.
6. CMS PDF/AI operations reject invalid/missing product targets before spending,
   check job/storage/link writes, preserve form input after errors, and release
   loading states. Upload/media failures display recoverable feedback.
7. All eight products have one purchase CTA to their own checkout. The hero
   provides a secondary “Bekijk wat je krijgt” anchor. Removed the product
   coach biography and competing header intake CTA on product/intake pages.
   Product highlights remain CMS-owned; prices and source images are unchanged.
8. CMS Inbox now searches/filters server-side, paginates 50 records at a time,
   counts independently, and opens older direct links without a first-page cap.
9. Stripe replays preserve existing order states, download tokens and completed
   provisioning jobs. Owner recovery requires paid/fulfilled orders; provisioning
   uses a claim and retains configuration-required feedback.

## Form / action coverage

| Rendered flow | Authoritative destination | Evidence / current limit |
| --- | --- | --- |
| Four-step intake, including about/contact/community sources | `/api/intake` → `intake_requests` → CMS Inbox | Existing labeled live QA record/reference visible; source, validation, safe retry, consent recovery tested locally; rollback-only DB insert/access tests pass. |
| Optional appointment step | Calendly → signed webhook → `calendar_appointments` + linked intake | Mocked signed persistence/cancellation/retry tests. Without client configuration an intake is waiting for a date, not falsely booked. |
| Eight traject detail starts | Matching `/checkout/[slug]` → Stripe session API | All eight click-throughs pass. Live product/key readiness blocks real purchase; prices are not invented. |
| Payment status / fulfillment | Server-confirmed Stripe session/webhook → orders, entitlements, jobs | Mocked paid/unpaid, duplicate, failed-write and owner-recovery checks. No real payment or delivery test. |
| Community interest | `/intake?source=community` | Browser source/destination checked. Not a community membership registration. |
| Contact email / telephone | `mailto:` / `tel:` | External device/client actions, not a website submission. Gmail mail does not automatically appear in this CMS. |
| CMS login / logout | Supabase Auth + active CMS membership | Existing owner session works; unauthenticated protected routes redirect. Unauthorized CMS API requests return 401. |
| Homepage / structured content save and publish | Content revisions + guarded SQL functions | Local action tests; actual owner save/publish/read and nonmember denial assertions inside a rolled-back transaction. |
| Product commerce form | `cms_products`, owner action, checkout cache invalidation | Local validation/ownership/readiness tests. Eight live records remain draft/unpriced. |
| Media upload / cleanup | Supabase site-media + media records | Owner/editor guards and failure UI reviewed; route restored. No production file uploaded/deleted. |
| PDF upload / AI generation | Private digital-products, digital_assets, product link, AI jobs/usage | Mocked missing-target/error paths; no paid AI call or real upload. |
| AI text assistant | Server provider + AI job/usage records | Mocked persistence/error guards. Generated copy is a draft, not automatically published website content. |
| Lead status / notes / read state | `intake_requests` owner update | Checked row writes, local tests and rollback-only RLS checks. |
| Inbox replies / intake follow-up | Resend + email_threads/messages | Mocked role, retry and persistence tests; real email blocked by account/domain setup. |
| Calendar synchronize | Calendly API + appointment/intake upserts | Checked writes and owner guard. No real sync/booking during QA. |
| Integration keys / tests | Super-admin action + Supabase Vault, health metadata | Secrets not exposed in page. No credentials changed or provider health tests triggered. |
| Order recovery actions | Paid order + entitlement/Trainerize job | Mocked role, paid-state, busy/completed and missing-configuration checks. No access granted in production. |
| Inbox/calendar filters and CMS search | URL/query navigation | Read-only controls; do not create customer submissions. |

Legacy calculator components are not rendered: `/gratis-tools` redirects to
`/community`. Calculations are not lead submissions. We do not claim every
navigation/search field should be saved as a customer message.

## Security evidence

- Live unauthenticated checks: nine existing CMS pages redirect to login; Media
  was a missing-route 404 (fixed in this release). Three CMS API POSTs reject
  unauthorized callers with 401. All three unsigned provider webhooks reject
  requests with 400. Empty intake/checkout payloads return 400.
- All 19 public Supabase tables have RLS enabled. Anonymous access to intake,
  order, email and entitlement data is denied; published content is intentional.
- Owner/super-admin membership is authoritative; editor access does not include
  customer PII/fulfillment or privileged key storage.
- SQL review checked fixed search paths, explicit caller/role validation and
  absence of anonymous EXECUTE grants on flagged CMS SECURITY DEFINER functions.
- `supabase/tests/intake-lead-workflow-rollback.sql` and
  `supabase/tests/cms-publishing-rollback.sql` passed against the selected project.
  Every QA mutation was rolled back; no production schema or content was changed.
- Security headers include frame DENY, nosniff, HSTS and restricted device
  permissions. No secrets were printed, committed, rotated or put in client code.
- Supabase advisory still reports leaked-password protection disabled. Enable
  after owner approval; MFA/session-policy review and a full penetration test are
  separate hardening work. Three SECURITY DEFINER advisory entries were reviewed,
  not silently dismissed as proof that all database security is perfect.

## Validation

- `npm run test`: **223 tests in 45 files**, pass.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass (48 generated pages).
- `npm audit`: **0 known vulnerabilities** at audit time.
- Playwright: **30/30** browser tests, covering public links, intake recovery,
  all eight checkout routes, 320/375px layouts, animation phases/reverse/resize/
  reduced motion and accessibility. Key pages have no serious/critical axe
  violations in this suite. Resize verification was synchronized to refreshed
  GSAP geometry in the test; no animation implementation was changed.
- Built non-fixture preview inspected at 1440×1000 and 375×812. Duo hero fully
  reveals, one purchase action, no biography; product/intake/community/checkout
  checks show no page overflow, loaded broken images or JS page errors.
- Screenshots: `artifacts/qa/smoke-20260911-duo-{desktop,mobile}.png`.
- Existing authenticated live CMS dashboard, website editor, products, orders,
  appointments, Inbox, AI, monitoring and settings inspected read-only.

This is functional/responsive smoke coverage, not a real-device performance
benchmark, high-volume load test, or proof of every paid provider round trip.

## Remaining delivery gates / honest limitations

1. **Commerce:** eight production products are draft with null price amounts and
   Stripe price IDs. Production publishable key and canonical site origin also
   require configuration. Existing key variable names / an old “connected” badge
   are not proof of valid matching live credentials. Confirm approved prices,
   keys/account/mode, webhook and an authorized purchase before enabling sales.
2. **Email:** client has no Resend account/DNS access ready. Configure verified
   sender and inbound reply domain/webhook. CMS intake storage already works;
   automatic new-intake business notifications are a separate unimplemented
   feature, not silently provided by a Resend key. Gmail is not auto-synchronized.
3. **Appointments/community:** client Calendly access and community group URL are
   still needed. Existing no-date queue and interest-intake fallbacks are honest.
4. **Trainerize/AI:** client credentials/endpoints/plan mapping needed, followed
   by approved provider acceptance. No paid generation/provisioning performed.
5. **Recovery:** a crash after issuing a download token but before confirming its
   email preserves the token and leaves an operator warning. Owner resend is the
   recovery path; no exactly-once cross-provider/outbox guarantee is claimed.
   Uncertain Trainerize outcomes require provider review before a manual retry.
6. **Content:** generic benefit/process/FAQ copy remains CMS-editable; client must
   approve richer package-specific deliverables before final handover. No claims,
   timelines or pricing were invented. The requested coach promo removal is done.
7. **Follow-up hardening:** leaked-password protection, MFA/session policy, and
   optional CSP/error-monitoring setup need an explicitly scoped follow-up.
   Existing Inbox reply server-action errors still navigate to feedback (unlike
   the updated upload/AI forms); a richer draft-preserving reply UI is future work.

No real charge, email, booking, provisioning, production upload/delete or new
persistent intake was created in this audit. Prior QA reference
`KRA-26-DD450D88` remains explicitly labeled not to contact.

## Briefing

One-off briefing scheduled for **Saturday 12 September 2026 at 10:00
Europe/Brussels**, using automation `kratos-client-handover-briefing`. It will
summarize this report, deployed/local status, remaining client setup and next
build priorities; it must not make payments, contact clients or change prices.

## Release verification

Pending final Git/Vercel release verification. Do not interpret local test
success as proof that production has received the repairs.
