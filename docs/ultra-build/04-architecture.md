# 04 — Architecture

## Boundaries

### Browser

- Renders marketing routes and local-only tools.
- Submits validated intake and checkout intent.
- Never owns price, payment status, Stripe secret, webhook truth, or Trainerize mapping authority.

### Next.js server

- Resolves canonical products from server-owned configuration.
- Validates intake input.
- Creates Stripe Checkout Sessions only for active products with verified Price IDs.
- Reads verified checkout status for success rendering.
- Redirects mapped Trainerize products safely.

### Database, later

- Stores intake submissions, orders, payment events, and fulfilment status.
- Uses generated IDs and unique Stripe event/session constraints.
- Retains only necessary personal data.

### External providers

- Trainerize: exact external plan URLs; no API capability assumed.
- Stripe: future payment session, Payment Element, and signed webhooks.
- Email/CRM: not selected.

## Security rules

- Product price and availability come from the server registry.
- Allowlist Trainerize host and exact configured URLs.
- Never accept arbitrary return URLs.
- Verify Stripe-Signature against the raw body.
- Make webhook processing idempotent by event ID.
- Do not expose secrets in client bundles or logs.
- Rate-limit intake and checkout-session creation.
- Add bot protection only if abuse is observed; preserve accessibility.

## Rendering and performance

- Optimize source photos with responsive image sizes and AVIF/WebP derivatives.
- Keep display fonts local and preloaded only where needed.
- Lazy-load below-fold campaign imagery.
- Avoid scroll-linked parallax on mobile and under reduced motion.
- Free tools calculate locally unless server persistence is explicitly added.

## Implementation — 2026-08-21

Pages live in `app/`, reusable UI in `components/`, contracts in `src/domain` and `src/schemas`, server-only catalogue/provider logic in `src/server`, and runtime facts in `config/`. Live mutation paths remain behind verification and connector gates. Free-tool calculations remain disabled because formulas were not supplied.
