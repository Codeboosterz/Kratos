# Unit 24: Public flow polish

## Goal / source
The user's 11 September audit request requires clear CTAs without competing
duplicates and smooth responsive behavior. Unit 19 found two identical purchase
CTAs plus an unrelated coach promotion on each package page.

## Scope / design
Keep one purchase button in the final product summary. The hero instead links
to the actual package contents, with its existing CMS-editable highlights.
Remove the unrelated coach-promotion section from product detail pages, as
previously requested. Keep informational navigation but suppress the competing
global intake CTA on intake and product-detail pages. Header menu must remain
right-aligned. No prices, package images, checkout behavior or CMS schema change.

## Animation audit
Investigate the failing community resize test with geometry evidence. Preserve
approved GSAP visuals. Only correct a proven geometry defect or stale test seek,
not redesign the animation. Verify 2013/1440/1280/375px and reduced-motion cases.

## Files / implementation
- `app/trajecten/[slug]/page.tsx`, header component, scoped CSS if needed.
- `tests/e2e/site.spec.ts`, community-finale resize test if timing is proven.
- Failing CTA contract assertions first, then focused/full browser checks.

## Dependencies / out of scope
No new dependencies, copy claims, provider work, images or animation redesign.

## Verification
- [x] One checkout CTA on each of all eight package pages
- [x] Hero contents anchor exists; no coach promotion or conflicting intake CTA
- [x] Mobile menu and reduced-motion scroll remain usable
- [x] Full 30-test browser suite passes; resize passes three additional repeats
