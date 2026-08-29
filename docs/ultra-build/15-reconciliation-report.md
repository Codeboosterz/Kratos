# 15 — Reconciliation report

## Sources compared

1. Client request and supplied links.
2. Current live Kratos site.
3. Nine supplied campaign assets.
4. Canonical route and action registries.
5. Eleven generated screen mockups.

## Reconciled

- Home hierarchy is intake-first.
- Commercial catalogue is separate from free tools.
- Training bundles, online coaching, duo coaching, home workouts, and transformation offers have product records.
- Desktop and mobile checkout use the same product/price source.
- Success state leads to intake.
- All ten unique Trainerize URLs are retained.
- Sticky CTA behavior is specified and has Motion and GSAP alternatives.
- Results page reserves proof components for the current-site testimonials but keeps them unpublished until source and permission are approved.
- Unknown prices are not invented in the design set.

## Material gaps

| Gap | Consequence | Resolution |
| --- | --- | --- |
| Trainerize GUID-to-product mapping unknown | external purchase buttons cannot safely activate | client maps all ten GUIDs |
| prices unknown for most products | Stripe Prices cannot be created | client supplies authoritative catalogue |
| intake cost unknown | “gratis” may be false | confirm or use neutral copy |
| canonical Omar identity unknown | cross-page face drift | select one source set |
| location/service radius missing | local conversion and SEO weaker | provide approved wording |
| testimonials and stats unverified | trust/legal risk | retain hidden until approved |
| Stripe account/credentials absent | checkout cannot process | configure after build approval |
| legal copy absent | cannot publish legal routes | obtain approved privacy/terms/cookie text |
| source logo file absent | implementation cannot use a clean official mark | obtain official SVG or transparent PNG |

## Design exceptions

- The checkout mockups display a neutral Stripe placeholder and explicitly state that Stripe is not connected. Production must replace this only after a real session exists.
- The online-coaching dashboard is synthetic visual communication, not real client data.
- Campaign references include dense poster typography; website implementation must keep copy in HTML.

## Build authorization status

Not granted in this package. The handoff is ready for a separate Codex build phase after the P0 mapping, price, identity, and stack decisions are accepted.

## Final reconciliation — 2026-08-21

The later master build prompt granted repository-local implementation. Source and handoff intent are now implemented with truth locks intact. Differences from the mockups are deliberate: no unverified stats/testimonials/credentials, no production prices, no fabricated calculators, and no ambiguous payment-success state. Existing dirty hero frames, `public/index.html`, PDFs, and `public/images/` were preserved. Deployment remains unauthorized.
