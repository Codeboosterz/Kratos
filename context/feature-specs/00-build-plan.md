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
| 10 | Community photo refresh | Existing community reveal | Complete / Local preview |
| 11 | Community reveal finale | Unit 10 | Complete / Local preview |
| 12 | Community release and next animation check | Units 10–11 | In progress |

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
