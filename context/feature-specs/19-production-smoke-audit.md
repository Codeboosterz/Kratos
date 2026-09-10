# Unit 19: Production smoke audit

## Goal

Produce evidence-backed coverage of public routes/forms, CMS authorization and
owner workflows, CTA destinations, responsive layout, and production readiness.

## Source of Truth

- User request, 11 September 2026: smoke test, fix verified defects, remove
  duplicate competing CTAs, and brief on 12 September at 10:00 Europe/Brussels.
- Existing six context files and deployed commit `3537abe`.
- Production Supabase project `anmeoctiwgybbvgwmjho` and kratosfitness.be.

## Scope

- Inventory all rendered forms, protected actions/API routes and public links.
- Bounded live read-only smoke checks; authenticated CMS inspection if the
  existing browser session permits it; no real customer submissions or messages.
- Local fixture regression tests and desktop/mobile UI checks.
- Review RLS/grants and privileged function guards with read-only metadata and
  rollback-only assertions. Do not change production schema or credentials.
- Document proven defects and address each distinct boundary in a follow-on unit.

## Out of Scope

Payments, email sends, appointment creation, price changes, credential rotation,
new providers, load/stress testing, unrelated media or animation redesign.

## Design

Preserve the approved carbon/lime design. Evaluate duplicate actions within a
task area separately from useful global navigation. Preserve all source images.

## Architecture

Public intake is the lead-capture boundary. CMS membership and database RLS are
independent gates. Provider configuration and confirmed outcomes are separate
from functioning UI routes. Tests must never enable fixture mode on production.

## Implementation Plan

1. Schedule the requested one-off briefing and record the baseline.
2. Inventory source routes/forms/actions and review security/data paths.
3. Run local validation and bounded production checks.
4. Record findings, implement isolated repair units, then rerun acceptance.

## Files to Create or Modify

- `context/production-smoke-audit-2026-09-11.md` — coverage, findings, evidence.
- `context/progress-tracker.md`, `context/feature-specs/00-build-plan.md` — status.
- Focused tests/scripts as needed; app fixes require a follow-on scoped spec.

## Dependencies

None.

## Verification Checklist

- [x] Public form and protected mutation inventory complete
- [x] CMS denial paths and database restrictions verified
- [x] Provider gates accurately separated from code defects
- [x] Tests, typecheck, lint, build and browser smoke run
- [x] Local preview inspected
- [x] Findings and next actions recorded
- [x] One-off briefing scheduled for 12 September, 10:00 Brussels
