# Unit 17 — Faith & Fitness Community

## Request
Replace Gratis tools with a Faith & Fitness community.

## Scope
- Canonical /community landing page, old /gratis-tools permanently redirects.
- Header, mobile menu, footer and sitemap use the community route/label.
- Use existing approved community/faith images and carbon/lime typography.
- Explain faith, movement and connection without invented membership counts,
  schedules, prices, testimonials or live group access.
- Until a group link is supplied, offer an explicit interest/intake link with
  source=community. No automatic membership/newsletter opt-in or new platform.
- Reuse the existing gratis-tools CMS page record with community-specific fields;
  keep its internal slug and old revisions, so no database migration is required.
- Merge defaults for newly introduced fields without overwriting custom values.
- Shared navigation label edits invalidate the root layout after publication.
- Retain calculator code/API tests but retire their public landing page.

## Acceptance
Tests first: CMS default/legacy/custom content behavior; all public navigation;
redirect; interest source; responsive containment, loaded images and accessible
content. Existing animations/prices/media must not change.

## Status
Implemented locally. Ten focused CMS/default/publishing tests pass. Browser tests
verify redirect, navigation, source attribution, loaded images, 375px containment,
44px interest targets and serious/critical accessibility checks. Desktop and
375px community previews were visually inspected in the in-app browser.

Asked for the eventual group link; interest CTA remains the reversible default.
Edit through `/beheer/website?pagina=gratis-tools`, now labeled Faith & Fitness
Community. Publishing invalidates `/community`; no new database page/migration
is necessary. No production publication or deployment occurred.
