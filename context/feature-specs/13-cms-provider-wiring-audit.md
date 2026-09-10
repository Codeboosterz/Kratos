# Unit 13: CMS provider wiring and credential safety

## Goal and source of truth

Audit the existing public-to-CMS and CMS-to-public paths. The user supplied a
Stripe live secret and explicitly authorized storing it temporarily for testing.
Keep it encrypted/server-only; do not create live payments or enable products.
The provided business contact is Kratosfitness2025@gmail.com, not a buyer address
or proof of ownership of a sending domain.

## Scope

- Inspect production CMS, credential-slot metadata, published content and commerce
  configuration without exposing secrets or customer records.
- Store the supplied key only if it can be read and validated reliably. Preserve
  existing environment priority and clearly explain any shadowed Vault value.
- Correct the publishable-key input type and credential format validation.
- Use a shared fail-closed Stripe readiness check on the checkout page and API:
  matching test/live secret and publishable keys plus webhook signing secret.
- Ensure provider health errors cannot echo credentials into the CMS/database.
- Document remaining provider, catalogue and fulfillment gaps honestly.

## Out of scope

No live charges, subscriptions, customer messages, new accounts, migrations,
provider activation, price changes, image/animation edits or unrelated dirty files.
Do not publish code without a release gate. Never copy credentials into docs,
source, screenshots, fixtures or public client props.

## Design and architecture

Keep existing CMS layout. Credential inputs remain write-only. Only publishable
keys can cross the server/client boundary; actual secrets use Supabase Vault or
existing server environment configuration. Show configuration source explicitly.
An API health check is not proof that checkout/fulfillment is ready.

## Implementation plan and files

1. Read-only audit of settings, products, content publication, intake/inbox,
   Calendly and Stripe webhook code and database access policies.
2. Add failing tests for inputs, credential validation, mode matching and blocked
   checkout API requests; implement surgical fixes in src/operations and the
   settings/checkout routes. Add tests in tests/unit and tests/integration.
3. Run typecheck, lint, unit/integration/browser checks and build; open preview.
4. Record verification and unresolved handover gates here and in the tracker.

## Dependencies

None. Existing Stripe SDK, Zod, Supabase, Vitest and Playwright.

## Verification

- [x] Credential stored safely or exact blocker stated
- [x] No live payments or outbound customer messages created
- [x] Credential/input/readiness regression tests pass
- [x] Typecheck, lint, tests and build pass
- [x] Local preview visually checked (checkout; protected settings need local login)
- [x] Wiring matrix and unresolved provider gates recorded

## Audit outcome — 8 September 2026

This unit is an audit and local configuration-safety fix, not certification that
all commerce/email paths are production-ready. No code has been deployed for
this unit. The live community release remains commit `9bd0b17`.

The supplied photo was read locally and its candidate Stripe secret was checked
with a read-only balance request. Stripe returned HTTP 401. It was **not saved**
to Vault or the environment, and no payment/session/customer was created. The
failure could be an invalid/revoked key or a transcription error; do not guess
characters. Ask the user to enter the exact replacement securely. Use Stripe
test-mode credentials for payment tests, not a live secret. Rotate the key that
was shared in the photograph.

Production has environment-backed Stripe secret/webhook slots, no publishable
key, and no Vault credential references. An environment value takes priority
over a value saved in the CMS. Existing environment credentials were not changed
or validated by the supplied-key check. All eight commerce products are drafts
without prices or Stripe price mappings. Purchasing remains unavailable.

### Local fixes

- Publishable keys now use text inputs; only scheduling URLs use URL inputs.
- Stripe credential slots reject the wrong key type without echoing the value.
- Checkout page and API require matching secret/publishable modes and a webhook
  signing secret before contacting Stripe. These are format/configuration checks,
  not proof of account ownership, price correctness or webhook delivery.
- Settings show environment/Vault precedence and warn when a saved Vault value
  is shadowed. Resolution priority is unchanged.
- Health checks distinguish API reachability from checkout configuration, and
  provider exception text is no longer persisted/displayed by health checks.
- Stripe and Resend setup notes explain the remaining operational requirements.

### Front-to-back wiring matrix

| Path | Evidence / current state | Remaining gate |
| --- | --- | --- |
| Website editor → public pages | Revision save/publish RPCs and published-revision readers exist. Home has a published revision; eight other page definitions use approved fallback content. | Publishing structured content currently invalidates only its primary route. Verify dependent product pages and site-wide layout invalidation before handover. |
| Products CMS → checkout | Checkout reads `cms_products` server-side. Eight production products are draft/unpriced/unmapped. | Confirm real inclusions/prices, test-mode price IDs, then verify checkout and fulfillment before activation. |
| Products CMS → public product CTA | Public product start actions still use the static catalogue and environment-only Stripe availability; marketing presentation is separately managed under Website → Trajecten. | Consolidate the commercial source of truth. Saving a commerce product does not yet guarantee a matching public purchase CTA or product-page metadata. |
| Intake → owner CMS | Durable intake storage, idempotency and owner workflow code exist. Production intake inbox currently empty. | Complete a consented production acceptance submission when ready; no test customer message was submitted during this audit. |
| Intake data access | Existing production schema and owner-only RLS are present. Rollback-only fixture verified defaults, constraints, owner read/update, non-owner denial and anonymous denial. | All fixture writes rolled back. Existing in-memory public intake rate limiting needs a durability review before launch traffic. |
| CMS reply → Resend | Server-side send helper and owner-guarded reply action exist. | No account/API key or verified sender domain yet; actual delivery unverified. |
| Incoming email → CMS | Signed Resend webhook, receiving API fetch and inbox storage code exist. | Receiving address/webhook setup plus retry hardening: duplicate failed events are currently acknowledged without replay, and some database write errors are unchecked. |
| Intake → business email alert | Intake appears in CMS; follow-up action exists. | Automatic new-intake notification to the business Gmail address is not implemented. Do not describe CMS storage as an email notification. |
| Stripe → orders/documents | Signed payment webhook, order upsert, entitlements and Resend delivery paths exist. | Test retries/replay, document mapping, email delivery and expired/revoked claims. Stale processing events need recovery review. |
| Stripe → Trainerize | Fulfillment queues jobs and an owner action can provision clients. | Client API access, verified endpoint templates/plan IDs and provisioning acceptance test; no automatic job scheduler verified. |
| Calendly → CMS calendar | Optional scheduling flow and signed booking/cancellation reconciliation exist. | Client credentials, event URL and provider-confirmed test booking. An intake without a date remains a queue item, not an appointment. |
| Client administration | Production contains one CMS membership; owner/super-admin policies protect sensitive tables. | Confirm client account onboarding and role. The supplied email address alone is not a CMS account. |

### Resend setup handoff

The user confirmed neither a Resend account nor DNS access is ready. Do not
create an account, add billing, change DNS or send emails on their behalf yet.

1. Client creates/owns the Resend account and obtains DNS-management access for
   `kratosfitness.be` from the registrar/hosting administrator.
2. Choose and verify a sending domain/subdomain in Resend. Add only the exact DNS
   records Resend supplies; preserve existing mailbox routing. Do not replace
   existing root MX records to enable inbound email.
3. Set a verified sender through server-only `RESEND_FROM_EMAIL`; save the API
   key securely in the existing CMS/Vault slot or hosting environment. No key
   should be pasted into chat or committed to the repository.
4. For replies visible inside the CMS, provision a Resend receiving address
   (prefer a dedicated subdomain), set `RESEND_REPLY_TO`, and configure signed
   events at `https://kratosfitness.be/api/resend/webhook`. Save its separate
   webhook signing secret and test signature rejection, retry and deduplication.
5. Verify one explicitly approved send → receive → reply → CMS conversation and
   delivery-status round trip. Use Resend's supported test recipients for
   delivery-state simulations; no customer mailing list is needed.

`Kratosfitness2025@gmail.com` can receive business notifications; it cannot be a
verified Resend sending domain. Routing replies only to Gmail will not populate
the CMS inbox. Public contact/privacy content currently uses an Outlook address:
confirm the canonical contact before replacing it. Privacy copy also needs review
against the now-persistent intake/integration workflow and agreed retention.

References: [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction),
[Resend receiving](https://resend.com/docs/dashboard/receiving/introduction),
[Stripe key modes and safety](https://docs.stripe.com/keys).

### Additional release gates

- Supabase leaked-password protection is disabled. Three authenticated
  security-definer RPC warnings concern existing CMS functions with explicit
  owner/super-admin guards; do not blindly revoke the required permissions.
- The intake migration was already applied remotely as `20260907021301`; no
  migration was needed or reapplied during this audit.
- Package descriptions, the product-page coach block and final visual polish
  remain in Unit 09, not silently included in this configuration unit.
- Deployment needs its own scoped review/release gate; preserve unrelated dirty
  files, especially the existing standalone `public/index.html` rewrite.

### Verification results

- Red-first checkout tests reproduced three incomplete configurations incorrectly
  reaching Stripe; the new guard fixes all three.
- Typecheck, ESLint and 95 unit/integration tests across 31 files passed.
- Production build passed with 47 generated pages.
- Production rollback-only intake/RLS test passed; no fixture data remains.
- Initial browser run: 26/27 passed. Community resize containment timed out;
  isolated rerun passed unchanged. The full rerun with two workers passed all
  27 tests. No animation code or test assertions were changed; retain the first
  failure as a concurrency/timing investigation if it recurs.
- Non-fixture local checkout visually checked at
  `http://127.0.0.1:3200/checkout/transformatie-pack-10-sessies`: configuration
  warning present, no purchase button/session creation. Existing duplicated
  checkout brand headers noted for the visual-polish follow-up.
- Updated authenticated settings UI has not been visually verified locally:
  there is no configured local CMS login. Credential helper/action contracts
  pass automated tests; production settings were inspected read-only, and are
  still the pre-change version.
- `git diff --check` passed. No provider settings, published content, production
  code or schema were changed. The only production data writes were synthetic
  intake/RLS assertions inside the explicitly rolled-back test transaction.
