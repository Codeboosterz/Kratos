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
| 13 | CMS provider wiring audit and credential safety | Existing operations hub | Safety fixes deployed in 3537abe. Stripe credentials and Resend account/DNS still pending. See wiring gaps in Unit 13. |
| 14 | Live checkout preparation, prices unchanged | Unit 13 | Code deployed; purchase activation still blocked by live credentials and blank/draft CMS price mappings. No payment. |
| 15 | Intake persistence and source audit | Existing intake/CMS | Deployed and live intake/database/CMS acceptance passed. No new migration required. |
| 16 | All traject starts route to checkout | Unit 14 | Deployed; both start CTAs and checkout routes verified for all eight packages. Prices/readiness guards unchanged. |
| 17 | Faith & Fitness community replaces tools | Existing CMS publishing | Deployed: CMS-editable page, navigation and 308 legacy redirect. Interest intake used until a group link is supplied. |
| 18 | Production intake activation and scoped release | Units 13–17 | Complete: 3537abe live/READY; QA KRA-26-DD450D88 verified in public confirmation, DB, CMS and calendar waiting queue. No Stripe activation. |
| 19 | Production smoke/security/form audit | Unit 18 | Complete; report and 12 September 10:00 briefing scheduled. |
| 20 | Framework security patch | Unit 19 | Validated locally; Next 16.3.4, zero npm advisories. |
| 21 | CMS operation integrity | Unit 19 | Validated locally; Media route, role/row/cache checks. |
| 22 | Provider message durability | Unit 21 | Validated locally with mocked providers; no email/booking. |
| 23 | CMS form recovery | Unit 22 | Validated locally; uploads/AI errors and checked writes. |
| 24 | Public flow polish | Unit 23 | Validated locally; one product purchase action, no coach detour. |
| 25 | Inbox history access | Unit 24 | Validated locally; filtered pagination and deep links. |
| 26 | Fulfillment replay safety | Unit 25 | Validated locally; paid-order guards, no token/job resets on replay. |

## Ordering Notes

- Units 19–26: final 223-test / 30-browser-test acceptance, lint/typecheck/build
  and audit pass. Release verification pending; provider activation remains gated.

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
