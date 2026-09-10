# Build Plan

## Product

Kratos Fitness intake operations flow.

## Strategy

Build the data/security boundary before the public form and owner UI. Calendly
configuration remains optional for intake capture; final Calendly activation
is planned in Unit 09 once client credentials arrive.

## Units

| Unit | Name | Depends On | Status |
| --- | --- | --- | --- |
| 01 | Intake lead data boundary | Existing CMS auth | Complete |
| 02 | Four-stage public intake | Unit 01 | Complete |
| 03 | CMS intake inbox and calendar | Units 01–02 | Complete |
| 04 | Unscheduled intake visibility | Unit 03 | Complete |
| 05 | CMS progress rings and live release | Unit 04 | Complete |
| 06 | Mobile responsive optimization | Unit 05 | Complete / Deployed |
| 07 | Faith story stepper and layout | Existing Faith story | Complete / Deployed |
| 08 | Production release | Units 06–07 | Complete / Deployed |
| 09 | Client handover readiness | Units 01–08 | Preflight complete; final build 8 September |
| 10 | Community photo refresh | Existing community reveal | Complete / Deployed |
| 11 | Community reveal finale | Unit 10 | Complete / Deployed |
| 12 | Community release and next animation check | Units 10–11 | Complete / Deployed |
| 13 | CMS provider wiring audit and credential safety | Existing operations hub | Audit and local safety fixes verified; not deployed. Stripe credential rejected; Resend account/DNS pending. See wiring gaps in Unit 13. |
| 14 | Live checkout preparation, prices unchanged | Unit 13 | Code verified locally; activation blocked by live credentials and blank/draft CMS price mappings. No deployment or payment. |
| 15 | Intake persistence and source audit | Existing intake/CMS | Local hardening and rollback-only database checks verified. Production server secret still missing; no migration/deployment. |
| 16 | All traject starts route to checkout | Unit 14 | Both start CTAs on all eight packages use matching checkout routes. Prices and payment readiness guards unchanged. |
| 17 | Faith & Fitness community replaces tools | Existing CMS publishing | CMS-editable local page, navigation and legacy redirect implemented. Interest intake used until a group link is supplied. Not deployed. |
| 18 | Production intake activation and scoped release | Units 13–17 | Preflight passed; Production-only Supabase Secret saved by user. Scoped deployment and live intake acceptance in progress. No Stripe activation. |

## Ordering Notes

- Tests precede implementation in each unit.
- Intake workflow migration was applied to production on 7 September during
  Unit 09 preflight; the source-to-remote version mapping is in `supabase/README.md`.
- Preview follows implementation and full validation.
- Production deployment completed from `main`; Supabase migrations remain a separate operation.
- Unit 06 is a CSS-first responsive refinement with no data or provider changes.
- Unit 07 replaces only the public Faith story rail and desktop presentation;
  its GSAP timing, CMS chapter data, and mobile chapter flow remain intact.
- Unit 08 releases the validated Unit 06–07 allow-list through the existing
  GitHub `main` → Vercel production pipeline without applying migrations.
