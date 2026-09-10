# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript | Server-rendered routes and interactive islands |
| UI | Existing CSS token system, Lucide icons | Kratos public and CMS interfaces |
| Validation | Zod 4 | Shared client/server boundary validation |
| Data | Supabase Postgres with RLS | Source of truth for intakes and appointments |
| Providers | Stripe, Calendly, Resend | Checkout, optional scheduling and owner replies |

## System Boundaries

- `app/intake` and `components/intake-form.tsx` — public intake experience.
- `app/api/intake` — rate-limited, idempotent public write boundary.
- `app/api/calendly/webhook` — verified provider event boundary.
- `app/beheer/(protected)` — authenticated owner operations.
- `components/ui` — reusable, stack-native UI primitives shared by server-rendered screens.
- `src/operations` — provider normalization and server-only operations.
- `supabase/migrations` — reproducible schema, grants, and RLS changes.

## Routes / Screens

- `/intake` — four-stage intake and optional booking.
- `/beheer/inbox` — intake leads and Resend conversations.
- `/beheer/afspraken` — appointment calendar and agenda.
- `/trajecten/[slug]` — one final purchase CTA links to `/checkout/[slug]`;
  secondary hero anchor reveals the package contents.
- `/checkout/[slug]` — payment readiness requires active CMS product, exact price
  mapping and valid Stripe configuration; marketing links do not authorize sales.
- `/community` — Faith & Fitness landing page; `/gratis-tools` redirects with 308.

## Data Model

- `intake_requests` — structured lead, source, consent, workflow, appointment status.
- `calendar_appointments` — normalized Calendly invitee event linked by intake reference.
- `email_threads` / `email_messages` — Resend conversations.
- Community copy/images retain the registered `content_pages.slug=gratis-tools`
  identity and revision history. Its definition now publishes `/community` and
  uses `community_*` fields. Read-time defaults support older revisions while
  strict owner saves still require valid fields. Shared navigation publication
  invalidates the root layout.

## Auth and Access Model

- Public visitors submit only through `/api/intake`.
- Anonymous Data API access to intakes is denied. Authenticated users cannot
  insert/delete intakes; SELECT/UPDATE are restricted by owner-membership RLS.
- Owner/super-admin CMS membership can read and manage PII workflow fields.
- Service-role credentials remain server-only.

## External Services

- Calendly — optional embed, webhook, reconciliation, reschedule/cancel links.
- Resend — transactional/inbound email and replies.

## Deployment Model

Next.js on Vercel with Supabase as the production data source. Migrations are
committed separately from their production application.

## Invariants

1. Intake capture works without Calendly credentials.
2. Calendly owns appointment availability and booking mutation.
3. PII is never exposed through public Data API grants or client secrets.
4. Intake data is not duplicated into email tables merely for presentation.
5. Public marketing changes stay within the active approved unit; Units 10–11
   update only community media and its reveal finale, preserving the centre image.
6. Static CMS data visualizations remain Server Components unless browser state is genuinely required.
7. Intake retries never overwrite the first stored answers or owner workflow;
   confirmation returns the persisted reference. API uses the existing durable
   rate limiter, with that limiter's in-memory fallback on configuration/RPC error.
8. Community interest is an intake source, not a membership or booked appointment.
9. Provider events use durable claims and checked completion; duplicate events
   never reset completed orders/provisioning or rotate an existing download token.
   Incomplete digital email delivery is explicit operator follow-up, not assumed.
10. Inbox search/filter/pagination is server-side with independently resolved
    direct links; owner publication invalidates dependent product-detail pages.

## Production Activation Gates — 10 September 2026

- Vercel Production has `SUPABASE_SECRET_KEY`, saved by the user as Secret
  with Production-only scope. Commit `3537abe` is live and QA reference
  `KRA-26-DD450D88` verifies public intake → database → authenticated CMS and
  the unscheduled calendar queue. No additional intake migration was needed.
- All eight production commerce products remain draft with null price amounts
  and Stripe price IDs. Approved prices/IDs and activation must be supplied.
- Production also lacks `STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`.
  Use the canonical HTTPS origin and matching valid live Stripe credentials;
  the presence of existing secret/webhook variable names is not verification.
- Verify web-to-database-to-CMS and Stripe/webhook round trips after authorized
  configuration/deployment. No live payment or customer email was attempted.
