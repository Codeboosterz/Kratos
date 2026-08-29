# 18 — Release handoff

## Delivered

- Production-oriented Next.js implementation of all canonical routes and honest unavailable/empty/error states.
- Server-owned, Zod-validated product registry with unpublished prices.
- Exact ten-URL Trainerize registry with no inferred mapping.
- Three-step intake contract with rate limit, idempotency, retries, and non-production fixture.
- Stripe Checkout Sessions + Payment Element shell, authoritative status lookup, and raw webhook signature verification.
- Sentinel-based Motion sticky CTA with reduced-motion behavior.
- Substantive draft contact/privacy/terms/cookie pages and disabled free-tool shells.
- Generated 1200×630 Kratos social preview without identity/proof claims.
- Updated route, action, state, integration, screen, implementation, QA, and release documentation.
- 12 unit/integration and 7 browser checks passing; build, lint, and typecheck passing.

## Still required from the client

1. Official logo SVG or transparent PNG.
2. Canonical Omar identity reference.
3. Ten Trainerize plan-to-product mappings.
4. Verified product prices, billing type, tax/VAT treatment, validity, refund/cancellation rules.
5. Confirmation whether the intake is free.
6. Exact training location and service radius.
7. Approval/evidence for stats and testimonials.
8. Privacy, terms, and cookie copy.
9. Stripe, database, intake delivery, email, analytics, canonical URL, and hosting choices/credentials when activation is authorized.

## Deployment

Not started, not authorized, and not claimed.

## Recommended next milestone

Run the owner verification checkpoint, connect durable repositories/provider test configuration, rerun the complete suite plus Stripe CLI events, then authorize deployment separately.
# 18 — Release handoff

The public build is production-compilable and the existing provider boundaries remain intact. No deployment or production database mutation was performed in this phase.

Before release:

1. Replace temporary images through the owner media library.
2. Apply both Supabase migrations.
3. Confirm owner membership and publishing access.
4. Configure verified product prices and Stripe Price IDs.
5. Run `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.
6. Deploy the Next.js application to Vercel with the verified Supabase and Stripe environment variables.

## Production release — 2026-08-25

The Next.js application and branded CMS UI are deployed to [kratosfitness.be](https://kratosfitness.be). Vercel serves the application; Supabase remains the designed persistence layer for owner authentication, revisions and media.

Delivered in this release:

- approved black/lime/off-white visual system across the full route family;
- exact GSAP center-out 3×5 community reveal with desktop pinning and reduced-motion/mobile fallbacks;
- CMS-editable 15-image community set, with rule 8 as the centered Omar image;
- expanded Results and Gratis tools pages matching the approved editorial boards;
- local and production build, accessibility, responsive, form, checkout-fixture and route verification;
- clean Vercel deployment with local secrets excluded.

Activation still required:

1. Create or select a dedicated Supabase project; none of the accessible projects is an unambiguous Kratos target.
2. Apply the committed migrations, configure Auth redirect URLs, create the owner account and add the publishable/project values to Vercel.
3. Add confirmed Stripe Price IDs and webhook secret before enabling payment actions.
4. Replace temporary imagery and publish verified client stories through the CMS.

## CMS overview release — 2026-08-28

The reference-led CMS dashboard is live at [kratosfitness.be/beheer](https://kratosfitness.be/beheer). The release adds a functional route search, active sidebar states, four connected KPI cards, publication progress, provider health, an audit empty state, integration readiness and a routed work queue. No schema change was required. Stripe remains connected; Resend, Trainerize and OpenRouter correctly remain visible as configuration-required rather than being presented as active.
