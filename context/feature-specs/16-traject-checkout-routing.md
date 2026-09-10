# Unit 16 — Consistent traject checkout paths

## Request
All traject purchase flows must lead to Stripe checkout. Preserve prices.

## Scope and contract
- Catalogue/home cards keep detail links so visitors can read the package first.
- Both hero and final package-start actions link to /checkout/<same slug>.
- All eight packages use this internal route, including any stale external mode.
- Checkout—not the marketing link—enforces active CMS product, exact price and
  valid provider configuration. Do not fabricate prices/IDs or enable draft sales.
- General help/intake links remain clearly separate from product purchase CTAs.
- No live transaction, credential changes or deployment.

## Tests first
All catalogue slugs resolve to checkout without credentials; API continues to
reject unconfigured/draft products; browser traverses each card, both starts and
matching checkout. Inspect a local product-to-checkout flow.

## Status
Local implementation complete. 37 focused payment/readiness tests pass; local
Duo hero-to-checkout verified. Automated traversal of all eight catalogue cards,
both detail start links and matching checkout pages passes. Production
prices/credentials remain unconfigured and unchanged; no real payment attempted.

Production requires approved CMS amounts and Stripe Price IDs (all eight records
currently draft/null), valid matching live secret/publishable/webhook credentials,
and `NEXT_PUBLIC_SITE_URL=https://kratosfitness.be`. No amount or ID was invented.
