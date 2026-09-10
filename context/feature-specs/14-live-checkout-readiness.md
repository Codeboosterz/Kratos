# Unit 14: Live checkout preparation, prices unchanged

## User instruction

Leave package prices unchanged and prepare the live payment page. This supersedes
the local demo preview request. Do not create a EUR 1 product, charge a card,
activate draft products, change credentials or deploy without a scoped release.

## Bounded scope

- Make CMS commerce the source for internal product purchase actions and checkout.
- Share server-only readiness: active priced/mapped product, complete Stripe keys,
  matching key modes, trusted origin; production requires live mode and all live
  payments require HTTPS, including a locally started server with live keys.
- Check the configured Stripe Price before session creation: exact CMS amount and
  currency, correct mode, active, one-time, fixed per-unit pricing. No overrides.
- Carry the displayed price as a comparison-only quote; reject stale quotes.
- Retain idempotency on retry, handle provider loading/errors and confirmation
  exceptions, remove duplicate checkout headers, keep the existing visual style.
- Invalidate public commerce-dependent routes after a successful owner CMS save.
- Switch the local preview out of fixtures; keep fixture-only automated tests.

## Data and security

No database or provider writes during verification. CMS lookup failure must not
fall back to an active static sale. Only the publishable key reaches client props.
Prices in config/products.json and existing CMS records remain byte/value intact.
Stripe sessions use the stored price ID and quantity one, with no automatic taxes,
optional items, discounts, shipping or other charge-altering options added.

## Implementation files

Server checkout configuration/price validation helpers; commerce catalogue/start
action; checkout session schema/API; product detail CTA; checkout page/client and
success page; owner product-save cache invalidation. Add unit, integration and
browser regression checks. No package, image, animation or broader CMS redesign.

## Tests first / acceptance

- Red-first contracts cover CMS-vs-static readiness and failure, live mode,
  Stripe price mismatch/inactive/recurring/currency/mode, stale quote rejection,
  unchanged amount/price-ID passed to Stripe, and CMS cache invalidation.
- Confirm client error/retry behavior and one brand header in browser fixtures.
- Run typecheck, lint, all unit/integration tests, production build and E2E.
- View the non-fixture checkout locally and document remaining activation gates.

## External gates confirmed on 8 September 2026

Read-only CMS query: all eight products remain draft, price_cents and
stripe_price_id are null. The supplied photographed live secret previously
returned 401 and was not stored. Production publishable key is missing. These
cannot be repaired by inventing prices or pretending demo checkout is live.
Resend/Calendly setup and Unit 13 fulfillment/retry audit items remain separate.

## Status and verification — 8 September 2026

Local implementation is complete and verified. Live activation is still blocked
by the external gates above. No application deployment, payment/session creation
at Stripe, database write, provider-setting change or price change was made.

- Shared server-only checkout configuration now governs both the public product
  CTA and the checkout page/API. Product/checkout pages resolve at request time,
  so credentials and draft/active status cannot remain frozen in a static build.
- Missing/failed CMS lookups remain informational, never an active static sale.
  Owner product saves invalidate dependent product and checkout routes, including
  prior slugs. Marketing copy/media and other published-page behavior are unchanged.
- Stripe Price retrieval checks exact amount/currency, active/one-time/fixed
  pricing, and key mode before session creation. Client quotes only compare;
  they never set the amount. Session creation sends the existing price ID,
  quantity one and explicit currency with a product-scoped idempotency key.
- The buyer's email is collected in Stripe's ContactDetailsElement. The payment
  form displays Stripe's total and refuses confirmation if it differs from the
  displayed quote. Loading, initialization error, thrown confirmation error and
  canConfirm states are handled. Uncertain session requests retain the same key.
- One shared header and one main landmark remain on checkout and confirmation.
  No new dependencies, CSS redesign or catalogue price edits were needed.

### Results

- Red-first: 20 of the initial 29 server/CMS tests failed before implementation;
  the new browser test saw two headers. Five payment-form contracts failed
  before implementation. Two HTTP/live-origin contracts failed before the guard.
- 134 unit/integration tests across 36 files passed; typecheck and lint passed.
- All 28 browser tests passed with two workers, including checkout retries,
  375px containment, accessibility and unchanged animations. The new alert
  assertion was scoped to checkout because Next also has a route-announcer alert.
- Production build passed with 47 generated pages. First build encountered a
  malformed generated `.next/dev/types/validator.ts` after browser-server shutdown;
  no application type error. Its derived type directory was preserved in
  `/tmp/kratos-checkout-generated-types.CjZzrc/dev-types`, and a fresh build and
  separate typecheck passed without application-code workarounds.
- Production-mode local server (fixtures off) is running on port 3200. Desktop
  and 375px screenshots were inspected: one header, no demo label/amount/button,
  honest unavailable state, no horizontal overflow or page errors. Mobile image:
  `artifacts/qa/checkout-prepared-mobile.png`.
- Non-fixture local API returned 503 CONFIGURATION_REQUIRED with no payment
  session. This is the expected safe state, not a working live payment test.
- config/products.json, package.json and package-lock.json have no changes.
  Next regenerated next-env.d.ts for production route types; do not treat this
  generated path change as an intentional feature edit.

Preview: http://127.0.0.1:3200/checkout/transformatie-pack-10-sessies

### Remaining activation/handover

Enter exact valid live credentials securely (secret/publishable same account and
mode, correct webhook signing secret), map each approved package amount to its
existing live Stripe Price ID, verify webhook destination and fulfillment, then
explicitly activate intended products. Do not invent amounts or reactivate drafts
automatically. Unit 13's email/document/Trainerize retry and fulfillment gates
remain open; this work does not certify those paths or the production deployment.

References: [Stripe custom checkout](https://docs.stripe.com/payments/accept-a-payment?api-integration=checkout&payment-ui=elements),
[Stripe Price retrieval](https://docs.stripe.com/api/prices/retrieve),
[Supabase single-row reads](https://supabase.com/docs/reference/javascript/using-modifiers-maybesingle).
