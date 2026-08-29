# 03 — Stack decision

## Decision drivers

- SEO-sensitive public marketing pages.
- Dynamic product catalogue and future checkout.
- React-compatible Motion or GSAP animation.
- Server-owned Stripe session creation and webhook verification.
- Multi-step intake with optional later persistence.
- Team familiarity with Next.js, TypeScript, Tailwind, and Supabase.

## Options

| Option | Advantages | Trade-offs |
| --- | --- | --- |
| Next.js App Router | one React stack for SSR/SEO, server routes, Stripe, forms, and animation | more runtime complexity than a static site |
| Astro plus React islands | excellent static performance and minimal JavaScript | split mental model; future checkout and persisted flows need additional server architecture |

## Recommendation

Use the latest stable Next.js App Router with TypeScript and Tailwind CSS v4.

### Front end

- Server Components by default.
- Client Components only for filters, forms, tools, Stripe Elements, and motion.
- Semantic HTML and reusable section/components rather than screenshot backgrounds.
- Motion for React as the default animation library.

### Back end

- Next.js route handlers/server actions for intake and checkout boundaries.
- JSON product fixtures first.
- Postgres/Supabase only when persistence is authorized.

### Payments

- Stripe Checkout Sessions API plus Payment Element.
- Express Checkout can be added after the base flow is verified.
- Signed webhook using the raw request body.

### Testing

- Unit tests for product resolution, amount ownership, state transitions, and calculators.
- Playwright for intake, external Trainerize fallback, checkout fixture, failure state, mobile navigation, and sticky CTA.

### Observability

- Structured server logs with no secrets or sensitive intake payloads.
- Optional Sentry/PostHog only after consent and provider approval.

## Rejected decision

Do not rebuild as a single static HTML file. It would make the future payment, webhook, persisted intake, and typed action requirements harder to enforce safely.

## Implementation — 2026-08-21

Adopted Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Motion, Zod, Stripe, Vitest, Playwright, and axe. The legacy Express server remains historical and is not referenced by current scripts or Vercel configuration.
