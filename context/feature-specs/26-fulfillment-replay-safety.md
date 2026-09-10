# Unit 26: Fulfillment replay safety

## Goal / source
Unit 19 review found Stripe replays overwrote paid order/entitlement state and
reset Trainerize jobs, while several writes were unchecked. User authorizes
code repairs; no real payment, price or provider configuration is authorized.

## Scope / architecture
Use the existing durable webhook claim/checkpoint helpers for Stripe as well.
Insert orders and provisioning jobs without overwriting prior state on replay.
Never replace an existing entitlement/token from a webhook; only an explicit
owner resend can issue a new link. Check all authoritative persistence. Preserve
delivery warnings for operator follow-up when email is unavailable or an earlier
attempt granted access but did not finish its email. Do not infer delivery.
Owner resend/provision actions require a paid/fulfilled order, check writes, and
do not swallow the configuration-required redirect inside a catch block.

## Design / dependencies
Existing CMS warning/recovery actions and Stripe signatures; no new dependency,
schema, outbox architecture, refunds, credentials or financial transactions.

## Plan / files
1. Failing mocked Stripe handler tests for replay, queue persistence and ignored
   event checkpoints. No live Stripe API calls.
2. Update Stripe route, shared event helper, and order-operation guards.
3. Run focused and full validation; explicitly retain payment activation gates.

## Acceptance
- [x] Replay never rotates an existing download token or resets a job
- [x] Failed writes remain retryable, not false success
- [x] Paid-order guards and owner-only recovery remain enforced
- [x] Mocked tests/typecheck pass; no payment/email/provisioning performed

## Evidence / recovery limitation
17 mocked integration tests, 14 red before implementation, all green afterward.
Full suite: 223 tests, lint, TypeScript/build and npm audit pass. A crash after a
token is granted but before delivery is confirmed keeps that existing token;
the webhook warning requires owner review/resend, not a silent automatic token
rotation. No transactional email outbox or cross-provider exactly-once guarantee
is claimed. Trainerize uncertain outcomes require provider inspection before retry.
