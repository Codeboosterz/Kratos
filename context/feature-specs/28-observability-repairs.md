# Unit 28 — observability audit repairs

Approved by the user's request to fix the 19 September audit findings.

## Scope

- Prevent step navigation from implicitly submitting/validating intake contact.
- Treat every failed monitoring query as unknown, never zero/healthy.
- Show product checkout configuration readiness and saved integration-check age
  separately from queue health; preserve all purchase gates and existing prices.
- Log redacted checkout/catalogue/intake outcomes with correlation and duration.
- Report client/server exceptions without raw errors, URLs, PII or credentials.
- Wire public-page Vercel Analytics/Speed Insights with URL filtering and no
  authenticated, download or payment-confirmation telemetry.
- Correct factual privacy-storage text, retaining required legal approval gates.
- Public email stays Outlook, explicitly confirmed by the user this turn.

No product activation, provider credentials, migrations, charges, customer messages,
invented testimonials, policy approval, or marketing animation/media changes.
Production deployment separately authorized on 19 September: release only this
verified unit through the existing GitHub main-to-Vercel pipeline.

## Acceptance

1. Mouse/keyboard step 2→3 and back/forward do not show contact errors or POST.
2. Every monitoring query failure and rejected request renders unknown/error.
3. Draft/unmapped products cannot be presented as ready, even with a saved Stripe
   connected badge. Structural readiness is not described as an end-to-end test.
4. All observed failure paths emit bounded, typed, redacted logs; customer payloads,
   retry keys, full URLs, credentials and raw provider errors never enter them.
5. Client reporting endpoint is same-origin, size-limited, schema-validated and
   rate-limited; reporting failure cannot break the page or recurse.
6. Telemetry excludes non-public routes and strips URL query/fragment data.
7. Failing regression tests precede changes; lint/typecheck/unit/build/E2E pass.
8. Local preview is launched and inspected; external activation gates are reported.

## Verification — 19 September 2026

- Reproduced the intake transition regression in a failing browser test before
  the fix. Query/readiness helper tests and missing/stale provider render tests
  likewise exercised their failing states before changes.
- 262 unit/integration tests pass, including all seven monitoring read failures,
  transport errors, stale checks, checkout gates and log redaction/correlation.
- TypeScript, ESLint, production build and `git diff --check` pass.
- Full 31-test browser suite passes with `--workers=1`; two further browser
  checks pass for policy/back navigation and deduplicated redacted error reports
  (33 passing checks total). An initial eight-worker cold-dev run had two
  animation failures and an incomplete-JSON dev-server error. These did not
  reproduce on the full serial rerun; no motion code or assertions were changed.
- Visually inspected local intake contact opening without alerts and with focus
  on its heading; cookie preference saves and its status message renders. Local
  preview remains at http://127.0.0.1:3100/intake in fixture mode.
- Rapid double-back through the in-app browser once produced stale-document
  hydration output. Fresh load and normal single-step back navigation passed;
  the added automated policy/back-navigation test also passed without errors.
- CMS states are covered by 11 mocked server-rendering tests. No authenticated
  local CMS session, production form write, payment, email or booking was used.

## Delivery gates retained

- Release authorized; production verification is pending. Vercel dashboard
  measurement activation remains separate from deploying the SDK wiring.
  Local/fixture mode deliberately does not load those measurement SDKs.
- The eight live products were last observed as Concept with null price/Stripe
  price mappings. Use approved commercial terms and the existing intended Stripe
  account; do not invent prices, overwrite the supplied key or activate drafts.
- Run fresh provider and payment/fulfillment acceptance after authorized setup.
  The current Stripe key's existence does not establish the other readiness gates.
- Missing service setup, final legal details and customer-approved result stories
  are content/configuration handover work, not silently filled by code.
