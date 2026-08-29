# 02 — Requirements ledger

| ID | Requirement | Source | Status | Priority | Acceptance criterion |
| --- | --- | --- | --- | --- | --- |
| R-001 | Preserve black, off-white, lime Kratos identity | current site and client assets | confirmed | P0 | token system matches design direction |
| R-002 | Use supplied Kratos campaign images in the site/handoff | client | confirmed | P0 | all nine originals are packaged and mapped |
| R-003 | Redesign remaining screens | client | confirmed | P0 | catalogue, detail, checkout, success, intake, Omar, tools, results mockups exist |
| R-004 | Create wiring architecture for each page | client | confirmed | P0 | route map, page wiring docs, Mermaid architecture, action registry exist |
| R-005 | Create a Codex implementation handoff | client | confirmed | P0 | CODEX-HANDOFF.md and acceptance criteria exist |
| R-006 | First scrolled CTA slides into view | client | confirmed | P0 | sticky CTA follows Motion/GSAP contract and reduced-motion behavior |
| R-007 | Include all supplied Trainerize links | client | confirmed | P0 | ten unique URLs preserved exactly |
| R-008 | Map each Trainerize GUID to its product | required for live CTAs | unresolved | P0 | client confirms all ten mappings |
| R-009 | Include training bundles | client | confirmed | P0 | bundle records and catalogue cards exist |
| R-010 | Prepare payment screens for later Stripe connection | client | confirmed | P0 | desktop/mobile checkout and server-authoritative flow specified |
| R-011 | Connect Stripe now | client says later | out_of_scope | P0 | no live connection claimed |
| R-012 | Use “Plan gratis intake” | design proposal | unresolved | P1 | client confirms intake is free |
| R-013 | Publish 50 clients and four years experience | current site | unresolved | P1 | owner supplies evidence/approval |
| R-014 | Publish two existing testimonials | current site | unresolved | P1 | consent and source are recorded |
| R-015 | Publish €300 total for ten sessions | current site arithmetic | unresolved | P0 | client reconfirms before live Stripe Price creation |
| R-016 | Publish other product prices | not supplied | unresolved | P0 | client provides authoritative prices |
| R-017 | Use one canonical Omar identity | image consistency need | unresolved | P0 | client selects the canonical source image set |
| R-018 | Move calculators away from main purchase flow | audit recommendation | inferred | P1 | tools live under /gratis-tools |
| R-019 | Redirect /diensten to /trajecten | information architecture | inferred | P1 | permanent redirect exists |
| R-020 | Create real privacy, terms, and cookie pages | audit | confirmed | P0 | no placeholder legal links |
| R-021 | Display exact training location/service area | conversion need | unresolved | P1 | client provides location wording |
| R-022 | Payment amount is server owned | security | confirmed | P0 | no client/query amount accepted |
| R-023 | Payment success is webhook/session verified | security | confirmed | P0 | success route rejects unverified state |
| R-024 | Preserve all unknowns honestly | truth requirement | confirmed | P0 | unknowns remain null/disabled, never fabricated |
| R-025 | Respect reduced motion and keyboard navigation | accessibility | confirmed | P0 | automated and manual checks pass |
| R-026 | Avoid unsupported detox claims | evidence/brand credibility | inferred | P1 | use nutrition/recovery wording unless substantiated |
| R-027 | Treat the current port-3000 website as the production visual source of truth | client approval 2026-08-21 | confirmed | P0 | public design remains unchanged during CMS work |
| R-028 | Match the owner CMS to the website's carbon/off-white/lime system | client approval 2026-08-21 | confirmed | P0 | CMS uses the existing tokens and no blue/white dashboard theme |
| R-029 | Make CMS navigation understandable for non-technical owners | client approval 2026-08-21 | confirmed | P0 | no more than six plain-language primary destinations |
| R-030 | Make public content editable through authenticated, persisted CMS actions | client approval 2026-08-21 | confirmed | P0 | owner can save drafts, preview, and publish with audit history |
| R-031 | Select CMS persistence, authentication, and media-storage provider | client approval 2026-08-21 | confirmed | P0 | Supabase Auth + Postgres + Storage; project creation still requires organization/cost confirmation |

## Build status — 2026-08-21

- Implemented: R-001–R-007, R-009–R-010, R-018–R-020, R-022–R-026.
- Correctly gated pending owner verification: R-008, R-012–R-017, R-021.
- Intentionally not activated: R-011. Stripe adapter code and a labelled non-production fixture exist, but no live provider or deployment mutation was performed.
- R-020 is implemented as substantive draft privacy, terms, and cookie pages. Final legal approval remains a release blocker.
- Confirmed: R-027–R-031. The Supabase application boundary is implemented locally; managed project creation is gated only by organization/cost confirmation.
