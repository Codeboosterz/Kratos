# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript | Server-rendered routes and interactive islands |
| UI | Existing CSS token system, Lucide icons | Kratos public and CMS interfaces |
| Validation | Zod 4 | Shared client/server boundary validation |
| Data | Supabase Postgres with RLS | Source of truth for intakes and appointments |
| Providers | Calendly, Resend | Optional scheduling and owner replies |

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

## Data Model

- `intake_requests` — structured lead, source, consent, workflow, appointment status.
- `calendar_appointments` — normalized Calendly invitee event linked by intake reference.
- `email_threads` / `email_messages` — Resend conversations.

## Auth and Access Model

- Public visitors submit only through `/api/intake`.
- Anonymous/authenticated Data API roles receive no direct intake write access.
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
5. Public marketing sections are outside this unit.
6. Static CMS data visualizations remain Server Components unless browser state is genuinely required.
