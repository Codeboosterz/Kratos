# Production page and observability audit — 19 September 2026

## Outcome

The checked routes are reachable and the signed-in CMS renders, but successful
HTTP responses do not establish working customer flows. All eight checkout pages
currently report that checkout is unavailable. The CMS shows all eight products
as Concept with blank prices and Stripe price IDs. Its Monitoring page nevertheless
shows `Alles rustig`, because it covers queued/provider failures rather than full
purchase readiness.

This was a read-only audit against https://kratosfitness.be/, the authenticated
Vercel dashboard, and repository commit `215fca9`. No code, production settings,
prices, credentials or CMS records were changed. No forms were submitted, payments
started, messages sent, or bookings made. Only this report and the progress tracker
were updated locally.

## Verified scope

| Surface | Evidence | Result |
| --- | --- | --- |
| Public routes | GET checks for Resultaten, Werkwijze, Trajecten, Over Omar, Community, Contact, Intake, Privacy, Voorwaarden and Cookies | All 10 returned 200 with page titles and headings |
| Eight trajectory details | Each detail page and its corresponding checkout link inspected | All 8 returned 200; matching checkout URLs present |
| Eight checkouts | Response body checked for availability; Premium Online Coaching also visited through the UI | All 8 returned 200 but displayed `Checkout nog niet beschikbaar`; no payment form |
| Legacy tools route | `/gratis-tools` | 308 redirect to `/community` |
| Anonymous CMS boundary | Cookie-free GET to `/beheer` and `/beheer/monitoring` | Both 307 redirect to `/beheer/login` |
| Signed-in CMS | Browser session: Monitoring, Instellingen and Producten | Pages render; 8 products visible from the database |
| Public navigation | Trajecten Online filter, product detail and checkout links | Correct filter and destinations |
| Intake, without submission | Empty-step validation, valid demo selections in steps 1–2, back/next navigation | Step 3 incorrectly shows contact errors on arrival; reproduced twice |
| Browser diagnostics | Desktop walkthrough of public routes and three CMS pages | No captured warning/error console entries during these checks |
| Layout and media spot checks | Initial rendered desktop states of several public pages | No document-width overflow or completed-but-broken images detected in inspected states; not an exhaustive lazy-image or mobile audit |

The explicit unauthenticated HTTP matrix covered 29 routes: 26 HTTP 200 responses
and 3 expected redirects. This is route reachability evidence, not an end-to-end
acceptance test of all forms, payments, email, scheduling, or authorization roles.

### Product pairs checked

- `transformatie-pack-10-sessies`
- `premium-online-coaching`
- `training-voeding-bundle`
- `duo-coaching`
- `jouw-trainingsschema`
- `hwo-beginners`
- `hwo-lower-body-glutes`
- `12-weken-transformatie`

## Findings, in recommended order

### 1. Purchase readiness is absent from the health overview — high priority

Observed live: all eight CMS products remain Concept, with empty price, Stripe
product ID and Stripe price ID fields. All eight public checkout routes fail
closed with a clear unavailable message. The CMS Stripe integration has a saved
`Verbonden` status dated 28 August 2026; no fresh provider connection test was run.
A stored provider-success badge does not establish current checkout readiness.

Do not change prices, activate products, or assume the Stripe key itself is absent.
The next activation step needs approved existing commercial terms mapped to the
correct Stripe products/prices, plus a fresh server-side readiness verification.
The health overview should separately expose product configuration readiness,
integration test age, checkout availability and fulfillment readiness.

Source: `src/server/checkout-configuration.ts:20` currently collapses all blocked
states into `{ ready: false }`. `src/server/commerce-catalogue.ts` silently falls
back to inactive static products when a database read fails. Add safe owner-facing
reason codes so missing configuration can be distinguished from a database outage
without exposing keys or customer data.

### 2. CMS monitoring can falsely display a healthy state — high priority

Code-supported risk, not an injected production failure: in
`app/beheer/(protected)/monitoring/page.tsx:9`, only the webhook query's error is
checked. Errors from AI, Trainerize, email-count and entitlement-count queries are
discarded. Null data/counts become zero, allowing `Alles rustig` when part of the
monitor failed to load. The live page currently displays zeros and `Alles rustig`;
this audit does not establish whether any of those queries actually failed.

Each query needs an explicit success/error state. Unknown/unavailable must not be
rendered as zero/healthy. A webhook read error should also not always be labeled
`Migratie nodig`, since network and permission failures can have other causes.

### 3. Intake shows premature contact validation — medium priority

Reproduction on production, with no personal details or final submission:

1. Select a valid goal and experience, then move to step 2.
2. Select a format and enter a non-personal availability note.
3. Click `Volgende stap`.
4. Step 3 immediately displays the error summary and required-name, email and
   consent errors before those fields have been completed or submitted.
5. Return to step 2 and repeat: the same errors appear.

Likely mechanism, pending an isolated regression test:
`components/intake-form.tsx:348` reuses a button position whose type changes from
`button` to `submit` during the click transition. `next()` does not suppress that
click's default action. Give step advancement and final submission distinct,
unambiguous handling, and test that arrival at step 3 does not validate/submit it.

### 4. Performance, visitor and client-error visibility are incomplete — medium priority

- Vercel Web Analytics displays its Enable screen with Demo Data: not active.
- Speed Insights displays installation instructions and `No events collected`;
  the Production/Desktop view for the last seven days has no metrics.
- Repository dependencies/layout contain no Vercel Analytics or Speed Insights
  client instrumentation. No dedicated instrumentation/Sentry files were found.
- `app/error.tsx:5` receives an error in its type but only uses `reset`; the route
  error boundary does not report the error through an application telemetry path.
- Intake configuration/database failure paths in `app/api/intake/route.ts` return
  safe errors but have no corresponding structured failure log. Successful intake
  creation has a structured console event.

Next observability work should cover redacted route/error identifiers, backend
reason codes, request correlation and outcomes, and real-user performance. Page
views alone must not be treated as successful intake or checkout completion.
Avoid names, emails, free-text intake answers, tokens, and secrets in telemetry.

### 5. Other integration and delivery-content gaps remain

The signed-in integration overview reports 1/5 connected providers. Resend,
Trainerize, OpenRouter and Calendly show configuration required. These are saved
UI statuses; no fresh provider requests were triggered. The community CTA leads
to an intake-interest flow, not a completed membership flow.

Additional public-content observations to confirm before delivery:

- Contact publishes `KRATOS_FITNESS2025@outlook.com`, whereas the client email
  supplied in the task is `Kratosfitness2025@gmail.com`. Confirm the intended
  public mailbox before changing it.
- Resultaten still has four approved-story placeholders.
- Voorwaarden remains labeled as a concept; privacy copy describes an earlier
  unconnected intake/storage state. Reconcile the copy with the implemented
  system and obtain the appropriate client/legal approval.

## Runtime-log evidence and limitations

The Vercel runtime-errors connector returned 403, so the authenticated dashboard
was used instead. The available Last hour view, refreshed around 12:06 Brussels
time, showed current requests from this audit, including 200 responses for all
eight unavailable checkout pages. Warning, Error and Fatal counters were all zero
in that displayed window. Longer time windows in the menu were upgrade-gated.

No claim is made about a clean 24-hour history, production Core Web Vitals, full
role/RLS security, provider delivery, or new form-to-database persistence. Existing
intake-persistence acceptance evidence is recorded in the tracker from an earlier
release; it was not repeated by submitting data during this audit.

## Suggested next implementation scope (not executed)

1. Repair the intake step transition and add its regression test.
2. Make CMS query failures explicit; separate service readiness from queue health.
3. Add safe checkout/intake diagnostic events and error-boundary reporting.
4. Connect approved performance/visitor telemetry and verify real events.
5. Complete client-approved product mappings and provider setup, then run a
   separately authorized end-to-end acceptance test without changing prices.

No deployment was necessary for this read-only assessment.

## Subsequent repair — local only

After this audit the user requested the code errors be fixed and confirmed
`KRATOS_FITNESS2025@outlook.com` as the public mailbox. Unit 28 now repairs intake
step navigation, explicit monitoring-query failures, checkout reason visibility,
stale/missing provider-check status, safe runtime/client reporting and factual
privacy-storage copy. Public-page Vercel measurement code is installed but no
dashboard activation or production event verification has occurred.

262 unit/integration tests, lint/typecheck/build, the full 31-test browser suite
with one worker and two additional telemetry/navigation tests pass. See
`feature-specs/28-observability-repairs.md` for the initial transient QA failures,
local visual verification and remaining delivery gates. No prices, credentials,
product activation, CMS production records or live deployment were changed.
