# Unit 22: Provider message durability

## Goal / source
Unit 19 found unchecked database writes in Resend/Calendly handlers and CMS
replies. Fulfill the user's connected-forms/no-open-loops request without sending
real messages or changing provider configuration.

## Scope / architecture
Shared server-only webhook claim/checkpoint helpers use existing status,
attempts and received_at columns. Only completed/ignored events are acknowledged
as duplicates. Failed attempts can retry; processing attempts return retryable
responses until a bounded lease expires, then are reclaimed with compare-and-set.
Every authoritative inbox/calendar write is checked before completion. Unique
provider message IDs make replay safe. Inbound display-name addresses are
normalized for reply destinations. Outbound retries reuse a stable content key
and reconcile duplicate provider IDs instead of sending with a random new key.

## Design
No visual redesign. Existing safe CMS error states remain; provider/database
errors do not produce false success. Messages remain private to owners.

## Plan / files
1. Failing mocked handler/action tests for data loss and replay behavior.
2. Add `src/operations/webhook-events.ts`; update Resend/Calendly routes,
   inbox reply actions and calendar sync actions.
3. Test signatures, initial/replayed events, transient database failures, stale
   claims and owner/editor boundaries with synthetic data only.

## Out of scope / dependencies
No provider requests, payments, emails, migration, new dependency or credentials.

## Verification
- [x] Database failures cannot return completed/sent
- [x] Completed duplicates do not repeat work; failed processing retries safely
- [x] Processing claims use compare-and-set and a five-minute recovery lease
- [x] Message replay uses unique provider IDs; outbound retries use Resend's 24h key window
- [x] 15 mocked-provider tests and typecheck pass; no provider sends performed
