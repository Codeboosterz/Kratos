# 07 — Canonical route map

| Route | Purpose | Data | Primary action | States |
| --- | --- | --- | --- | --- |
| / | benefit-led home funnel | approved claims and featured products | open intake | default, CTA sticky, reduced motion |
| /trajecten | filterable product catalogue | product registry | view product | loading, empty category, unavailable product |
| /trajecten/[slug] | reusable product-detail template | one verified product | start trajectory or intake | Trainerize mapped, Stripe enabled, disabled |
| /resultaten | evidence and testimonials | approved proof records | open intake | unverified items hidden |
| /over-omar | coach story and method | approved biography/claims | open intake | default |
| /gratis-tools | local Macro QuickScan and meal-plan tools | local form values only | run tool | pristine, invalid, calculated, reset |
| /intake | three-step lead form | intake draft | submit intake | step 1–3, validation, submitting, success, failure |
| /checkout/[slug] | internal future checkout | verified product and server session | confirm payment | configuration_required, ready, processing, recoverable failure |
| /checkout/success | verified result and next steps | server-fetched session/order | open intake | verifying, paid, not paid, expired |
| /contact | accessible contact alternatives | verified business contact data | email/call/message | default |
| /privacy | privacy notice | approved legal copy | none | default |
| /voorwaarden | terms | approved legal copy | none | default |
| /cookies | cookie notice/preferences | approved consent configuration | save choices | default, saved |
| /diensten | legacy route | none | permanent redirect | 308 to /trajecten |

## Owner CMS routes — first editable slice implemented

| Route | Purpose | Primary action | Access/state |
| --- | --- | --- | --- |
| /beheer | owner overview | choose a common task | authenticated owner; configuration_required until auth exists |
| /beheer/website | pages, sections, navigation, and SEO | save draft / preview / publish | authenticated owner/editor |
| /beheer/trajecten | product content and visibility | save draft / preview / publish | authenticated owner/editor |
| /beheer/media | image library and metadata | upload / edit alt text / archive | authenticated owner/editor; storage required |
| /beheer/aanvragen | intake submissions | view / update follow-up status | authenticated owner; personal-data controls required |
| /beheer/instellingen | account, integrations, and site settings | update controlled settings | authenticated owner only |

Public routes remain unchanged. CMS routes are not added to public navigation or sitemap.

## API/server boundaries

| Route | Method | Purpose |
| --- | --- | --- |
| /api/intake | POST | validate and persist/forward an intake when a destination exists |
| /api/checkout/session | POST | create a server-priced Checkout Session |
| /api/stripe/webhook | POST | verify signature and process events idempotently |
| /api/checkout/status | GET | return safe verified order/session status |

## Product-route behavior

1. Resolve slug from the server registry.
2. Return not found for unknown/inactive products.
3. If checkoutMode is trainerize_external and mapping is verified, use the exact configured URL.
4. If checkoutMode is stripe_internal and Stripe is configured, route to internal checkout.
5. Otherwise show an honest disabled action and an intake alternative.

## Implementation — 2026-08-21

All canonical page and API routes are present. `/diensten` and `/diensten.html` issue framework-level permanent 308 redirects to `/trajecten`; sitemap and robots metadata routes are included.
