# Unit 15 — Intake persistence and source audit

## Request and evidence
The production intake displays CONFIGURATION_REQUIRED. Vercel environment-name
inspection on 10 September confirms SUPABASE_SECRET_KEY is absent; public URL/key
exist. The production intake table exists and contains zero records. Do not
substitute a public key or weaken RLS. No schema migration is required.

## Scope
- Preserve every published intake source, including about-final.
- Use the existing durable rate limiter.
- Make repeated submissions insert-only, returning the persisted reference,
  without overwriting the original lead or owner workflow.
- Handle database/transport failure without reporting success or losing draft.
- Keep Calendly/email optional; CMS reads intake_requests under existing RLS.
- Verify database grants/policies with rollback-only fixtures. No customer email,
  production form submission, credential creation, migration or deployment.

## Acceptance and tests first
Test configured storage without Calendly, duplicate retries, configuration and
database failures, rate limiting, header mismatch and public source contracts.
Run existing intake tests and inspect local form. Production acceptance remains
blocked until a server-only Supabase secret is securely configured and deployed.

## Status
Local hardening complete: 21 focused tests pass. Production rollback-only
defaults/RLS/owner-access checks pass; table returns to zero records. Local intake
opened at port 3200. Live capture still requires SUPABASE_SECRET_KEY in Vercel and
a deployment; no provider key or migration was changed.

The public API now preserves about/method/results/community source values. Storage
failure does not move the UI into a success state. Browser regression coverage
checks failure, retained answers, reload, renewed consent and same-key retry.

## Production acceptance still required
1. Separately authorize secure server-secret configuration and deployment.
2. Set `SUPABASE_SECRET_KEY` on Vercel Production for the existing Supabase project;
   never use a `NEXT_PUBLIC_` prefix or commit the key.
3. Redeploy, then submit one explicitly approved non-sensitive QA intake and
   verify the same reference in `intake_requests` and the owner's CMS Inbox.
4. Verify the unscheduled intake queue; only a real provider-confirmed date creates
   a calendar appointment. Resend/Calendly are not prerequisites for storing a lead.
