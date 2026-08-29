# 06 — Integration matrix

| Provider | Purpose | State | Auth/credentials | Operations | Failure behavior |
| --- | --- | --- | --- | --- | --- |
| Trainerize plan URLs | sell/deliver external programs | configuration_required | none for public links | redirect to exact verified URL | disable CTA if product mapping is unresolved |
| Trainerize client experience | external program/coaching fulfilment | capability and account configuration unverified | client account handled by Trainerize | link/invite only; no API assumed | explain that access follows the confirmed onboarding process |
| Stripe | future internal payments | configuration_required | publishable key, secret key, webhook secret, Price IDs | create session, render Payment Element, verify webhook/status | keep checkout disabled or fixture-only |
| Postgres/Supabase | intake/order persistence | not_connected | project URL and server credentials | create/read/update scoped records | retain forms locally and show honest unavailable state |
| Email provider | confirmations and coach notification | not_selected | provider-specific | send transactional messages | payment/order truth remains in database; retry email separately |
| Analytics | funnel measurement | not_selected | provider-specific and consent-aware | page/action events | site remains fully usable without analytics |

## Verified provider capabilities used in the design

- Stripe Elements supports a customizable Payment Element; Checkout Sessions is the recommended starting API for most integrations.
- Motion for React provides useInView and AnimatePresence.
- GSAP provides ScrollTrigger and a React useGSAP hook with cleanup.

No Trainerize API, fulfilment behavior, plan mapping, or account capability is assumed. Provider capability does not prove that the client’s specific account is configured.

## Implementation evidence — 2026-08-21

- Trainerize: exact allow-listed registry; all starts remain disabled because mappings are unresolved.
- Stripe: server-owned Checkout Session with `ui_mode: elements`, Payment Element shell, strict session lookup, raw-body signature verification, and visible configuration failures. Live calls require a verified catalogue record and complete server configuration.
- Intake: Zod, rate limit, matching idempotency header/body, and honest `CONFIGURATION_REQUIRED`; the labelled fixture stores no submitted content.
- Database, email, and analytics: not connected and not claimed.
