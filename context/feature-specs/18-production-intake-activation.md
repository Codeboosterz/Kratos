# Unit 18 — Production intake activation and scoped release

## Goal and approval
The user confirmed Supabase project `anmeoctiwgybbvgwmjho` and asked to start the
next stage after the request to configure its server key and deploy the approved
local changes. Activate production intake capture and verify it through the CMS.

## Scope
- Recheck Supabase/Vercel project identities and production configuration.
- Transfer an existing valid modern Supabase secret, or create one dedicated to
  this backend if none is available, into Vercel Production as a sensitive value.
  Do not print, commit or expose secrets in the public bundle.
- Release approved Units 13–17 and their necessary shared dependencies through
  the existing GitHub main → Vercel workflow, excluding unrelated static exports,
  media, attachments and generated development-type changes.
- Diagnose the existing resize test's release-gate failure; change only test
  synchronization if evidence proves stale measurements, not animation behavior.
- Verify one clearly labeled synthetic intake with an example.com email through
  the public flow, database and authenticated owner CMS. Do not send email or book
  an appointment; retain the record as labeled QA evidence unless cleanup approved.

## Out of scope
No new migration, product activation, price changes, Stripe key changes, real
payments, Calendly/Resend activation, owner-account changes or design changes.

## Architecture and design
Existing UI and RLS remain intact. The server-only Supabase client uses the
production secret. Non-sensitive project metadata can be logged; key values cannot.
CMS/checkout gates continue rejecting unconfigured payment products.

## Plan and verification
1. Inspect configuration and release diff; validate credential path without output.
2. Resolve the release gate, run type/lint/unit/browser/build checks.
3. Save production-only secret; validate server connection without customer reads.
4. Commit only the scoped allow-list and push without force. Verify deployment READY.
5. Check live intake, DB row, CMS record, public routes, and available runtime logs.
6. Record commit, deployment, verification reference and remaining payment gates.
7. Reuse local preview and inspect it; link both live and preview results.

## Status
Complete. The user saved the existing Supabase secret, and Vercel metadata confirms
`SUPABASE_SECRET_KEY` as Secret, Production only. No key value was read back or
stored in code. Commit `3537abe41bd4d4299d4ba07b833ddf41701a2b5f` is live;
deployment `dpl_Ee7AUjwgEtBmeUM9gvrUmXFWq4Nk` is READY with the production alias
`https://kratosfitness.be` (54-second build). No new migration, payment, email or
booking was performed.

## Production acceptance
- Public form submitted once using a new QA tab, preserving the user's old draft.
- Reference `KRA-26-DD450D88`, row `857d94e3-8314-442f-9b20-d278f71b2747`,
  name `QA Kratos — niet contacteren`, email `kratos-qa-20260910@example.com`.
  Note explicitly says synthetic QA, no contact/email/appointment.
- Exactly one DB row, source `about-final`, `lead_status=new`,
  `appointment_status=awaiting_booking`. Public step 4 confirms saved intake.
- Authenticated super-admin CMS Inbox shows all submitted fields and the same
  reference. Calendar shows one `Wacht op datum` queue entry, no dated appointment.
  Zero linked appointment rows and zero QA email threads. Record retained.
- All eight package detail/checkout routes return 200, with two correct matching
  purchase links per detail page; unconfigured commerce stays guarded.
- `/community` returns 200, `/gratis-tools` returns 308 to `/community`, and an
  unauthenticated `/beheer/inbox` request redirects to login.
- Vercel CLI runtime log confirms `intake_created` with the QA reference and
  scheduling unavailable. A 15-minute deployment error scan returned no errors;
  intake browser console has no errors/warnings. Continuous monitoring/drains
  were not audited. Local production preview remains on port 3200 and was inspected.

## Remaining handover gates
Payment activation still needs live Stripe configuration and approved CMS price
mappings. Resend/DNS and Calendly are not activated. Existing Supabase advisories
remain: three deliberately guarded CMS security-definer RPCs and disabled leaked
password protection. No security setting was changed during this release.
Remediation references:
- [Security-definer RPC review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

Verified on 10 September 2026:
- Supabase dashboard confirms project `anmeoctiwgybbvgwmjho`, Kratos Fitness,
  healthy, Frankfurt, with the intake workflow migration already applied.
- Settings → API Keys contains an existing modern `default` secret. Reveal/copy
  attempts through the browser connection did not return a usable full key.
  No key value was printed or stored; no new key is necessary.
- Vercel CLI confirms project `prj_LwG8szFzWAwDB9Q64cI6zd6J5h98` in team
  `team_3M1tpbvnG7nzX6wbXCVkDr3Y`. Production has the Supabase public URL and
  publishable key; the user has now added `SUPABASE_SECRET_KEY`.
- Vercel connector returned 403. Vercel CLI metadata access works, but Supabase
  CLI key retrieval timed out without output. The user completed direct browser
  entry; Vercel shows the saved variable and successful-add confirmation.
- Read-only SQL recheck confirms intake RLS enabled, service-role INSERT/SELECT
  available, and no anonymous table SELECT grant.
- 163 unit/integration tests and all 30 browser tests pass; lint, TypeScript,
  production build (48 pages) and diff whitespace checks pass.
- Rebuilt non-fixture preview on port 3200; community layout visually inspected.

Release scope: 59 reviewed files were committed and pushed without force.
`public/index.html`, `next-env.d.ts`, attachments/PDFs, `assets/`, `prompts/`,
CLAUDE/CODEX-HANDOFF files and unrelated readiness notes were left untouched.
Post-release acceptance notes are local documentation changes; no second app
deployment is needed. Payment activation remains out of scope.

## Release-gate diagnosis
The retained Playwright trace proves stale resize measurements: at timestamp
12241.69 the viewport was already 1280×600 but the community pin range still read
7063–10271 (the 2013×1604 range). By timestamp 12455.976 it had refreshed to
2872–4672, after the test had already scrolled to the obsolete target. Replace
the fixed 350 ms sleep with a poll comparing the range against actual DOM
geometry, and assert progress near 0.96 rather than accepting 1.0 beyond the
section. Production animation code and the fit/visibility assertions are unchanged.
