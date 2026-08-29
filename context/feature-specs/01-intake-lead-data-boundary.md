# Unit 01: Intake Lead Data Boundary

## Goal

Add the minimal workflow fields, types, protected mutation, and reconciliation
behavior needed to operate intake leads safely from the CMS.

## Source of Truth

- Approved user plan from 2026-08-30.
- `supabase/migrations/20260828133052_calendly_appointments.sql`.
- `app/api/intake/route.ts` and `app/api/calendly/webhook/route.ts`.

## Scope

- Lead status, read marker, reader identity, and internal note.
- Owner-only select/update policies and explicit grants.
- Tests for source attribution, migration security, and appointment reconciliation.
- Include canceled events during Calendly reconciliation.

## Out of Scope

- Applying the migration to production.
- Provider credential changes.

## Architecture

The public API continues to write with the server admin client. Protected CMS
Server Actions re-authenticate the member and update only allow-listed workflow
columns. Calendly reconciliation continues to normalize provider records.

## Verification Checklist

- [ ] Failing tests written first
- [ ] Migration contains RLS, grants, indexes, and workflow constraints
- [ ] Database types updated
- [ ] CMS mutation validates and authorizes
- [ ] Calendly reconciliation can recover canceled events
- [ ] Relevant tests pass
