# 00 — Intake audit

## Classification

- Work type: greenfield rebuild and redesign handoff
- Current public site: https://kratosfitness.be/
- Current secondary public page: https://kratosfitness.be/diensten.html
- Repository available: no
- Existing package manifest, source tree, migrations, tests, or deployment configuration: not available
- Production mutation authorized: no

## Current public experience observed

- Dark carbon/black visual system with lime accent, Kratos K mark, Outfit/Inter-style typography, and Omar photography.
- Homepage sections: hero, Omar, benefits, three price cards, Macro QuickScan, meal-plan builder, testimonials, FAQ, footer contact.
- Hero “Start vandaag nog” points to the footer; footer contact uses email.
- Current package claims: one session €50; five sessions €35 per session; ten sessions €30 per session.
- Services page lists nine offers with equal weight.
- Privacy and terms links were placeholders at time of inspection.

## Supplied material

- Nine Kratos campaign images covering training schema, training plus nutrition, premium online coaching, 10-session transformation pack, duo coaching, two home-workout offers, and a 12-week transformation.
- Eleven Trainerize URLs containing ten unique plan GUIDs; the first URL was duplicated.
- Approved home desktop and mobile redesign direction.

## Tool and provider state

| Item | State | Evidence |
| --- | --- | --- |
| Image generation | available and used | eleven final route/state mockups |
| Trainerize links | supplied; plan details not reliably inspectable | exact URLs retained in config |
| Stripe | configuration_required | no keys, account, Price IDs, or webhook endpoint supplied |
| Database | not_connected | no project supplied |
| Hosting | not_connected | no hosting project supplied |
| Analytics | not_connected | no provider selected |

## Risks

1. Trainer identity varies across supplied campaign images.
2. Ten Trainerize GUIDs are not mapped to named products.
3. Most product prices are unknown.
4. “Gratis intake”, client count, experience, and testimonials require owner verification.
5. Payment success must be server verified; the mockup alone is not an integration.
6. Fitness and nutrition content requires careful disclaimers and must avoid unsupported medical promises.

## Recommended next phase

Approve the stack and resolve the product-to-Trainerize mapping before production implementation. Build may proceed in fixture mode for visual QA, but live purchase buttons must remain disabled until a product has a verified destination or Stripe Price ID.

## Continue-build delta — 2026-08-21

The supplied repository was audited as a legacy Express/static site with user-owned dirty assets. The Next.js application was added without overwriting those assets. Implementation proceeded under the authorized build prompt; production purchase buttons remain disabled and no deployment/provider mutation occurred.

## Continue-build delta — 2026-08-25

- Mode: autonomous Continue Build, interface-heavy hybrid product.
- Approved visual source: the user-selected 9:21 homepage, catalogue, Omar, intake and trajectory-detail compositions.
- Preserved contracts: Supabase owner CMS, immutable revisions, Storage, intake validation/idempotency, Stripe server checkout, legal routes and fixture safeguards.
- Added route: `/werkwijze`.
- Rebuilt surfaces: homepage, method page, Omar page and all trajectory details; shared editorial motion and responsive layout primitives now cover the remaining route family.
- Content safety: prices, reviews, outcome metrics, biography claims and credentials remain unpublished until owner-confirmed.
- Media strategy: existing local photography is temporary and replaceable through the CMS media library.
