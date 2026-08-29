# Kratos Fitness

Conversion-first Dutch website for Kratos Fitness, built with Next.js App Router, TypeScript, Tailwind CSS v4, Motion, Zod, Stripe Checkout Sessions/Payment Element, Vitest, and Playwright.

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Normal local mode keeps intake delivery, prices, Trainerize product starts, and Stripe checkout disabled until their server-owned configuration is verified.

For the clearly labelled, non-production fixture paths used by QA:

```bash
KRATOS_FIXTURE_MODE=true NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 npm run dev
```

Fixture mode cannot run in production. The €300 value is visible only as a labelled test amount in this mode and is not a publishable product price.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright covers canonical routes, the 308 legacy redirect, intake, server-owned fixture checkout status, axe serious/critical violations, 320px overflow, mobile navigation, sticky CTA behavior, and visual evidence captures.

## Configuration boundaries

- `config/products.json` is the runtime product catalogue. Prices stay `null` until verified.
- `config/trainerize-plans.json` preserves the ten supplied URLs exactly. A URL is usable only after an explicit verified product mapping.
- `config/contact.json` includes only contact details already present in the repository. Location, service radius, hours, and response time remain unpublished.
- Stripe session creation accepts a product slug and idempotency key only. Amounts and Price IDs come from server data.
- `/checkout/success` always asks `/api/checkout/status` for authoritative state; query parameters alone never prove payment.
- The webhook verifies the raw body and `Stripe-Signature`, then returns `CONFIGURATION_REQUIRED` until durable order/event storage is implemented.
- The intake endpoint validates with Zod, rate-limits, and requires matching idempotency keys. Normal mode returns `CONFIGURATION_REQUIRED` until a reviewed delivery repository is connected.

## Production activation checklist

1. Confirm official identity assets and canonical domain.
2. Confirm prices, tax/VAT, duration, cancellation/refund rules, and whether the intake is free.
3. Map each product to the exact Trainerize plan or a verified Stripe Price.
4. Configure Stripe and a durable database-backed order/webhook repository.
5. Configure a reviewed intake destination and retention policy.
6. Approve legal copy, business identity, location/service radius, and contact policy.
7. Supply consented proof before publishing testimonials, statistics, or result imagery.
8. Re-run the complete suite and provider test events.

No deployment is included or claimed.
