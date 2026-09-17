# Unit 27 — Client photo placement

## Scope
Replace the fourteen surrounding homepage community tiles with all fourteen
client-supplied gym photographs. Keep position 8 and its mission image unchanged.
Move the previous grid's thirteen photos, excluding positions 7 and 8, into the
adjacent Faith & Fitness scrolling filmstrip, preserving their row-major order.
Keep the six existing chapter texts; chapters can contain multiple photos.

## Contracts
- Original JPEGs are copied byte-for-byte into public/images/community/gym/.
- No source images are deleted or retouched; object-position controls crops.
- Community geometry, pin timing, enlargement and centre treatment stay intact.
- Faith desktop cards advance through all 13 photos, with chapter copy/stepper
  synchronized; mobile shows those same photos in the six chapter groups.
- Additional chapter photos remain editable and saveable in the existing CMS.
- Upgrade only exact previous default media sets. Preserve custom CMS content.
- No database migration, payments or other page changes. Production publication
  was approved separately on 17 September after local acceptance.

## Acceptance and verification
Tests first: 14 new unique grid URLs; centre unchanged; 13 old photos in Faith;
both excluded photos absent; legacy/default migration and custom preservation;
CMS round-trip of additional image URLs and alt text; all files resolve.
Run lint, typecheck, unit tests, production build and targeted browser tests for
community/faith pinning, all 13 active-card states, reverse scroll and mobile.
Open and inspect desktop/mobile local preview; record checks in tracker.

## Status
Complete locally; approved production release in progress on 17 September.
Six chapter groups use 3,2,2,2,2,2 photos.

## Verification
- All 14 imported JPEGs were verified byte-identical to the supplied attachments.
- Lint, TypeScript, 228 unit/integration tests, all 30 browser tests and production
  build pass.
- Desktop acceptance covers all 13 photos, matching copy/stepper, reverse scroll,
  grid reveal/scale/release, pin handoff and breakpoint resizing.
- Desktop grid/filmstrip and 390px mobile photos visually inspected in browser.
- Visual QA found an existing mobile min-height/aspect-ratio overflow: cards
  extended to x=410 at 390px. Added a failing bounds assertion, then constrained
  width to the container and removed the viewport-derived minimum height.
- CMS extra photo URL/alt fields round-trip through the existing revision parser;
  blank slots are removed and unapproved external URLs rejected. Production CMS
  revisions were not written.
- Preview: http://127.0.0.1:3100/ (local fixture mode; no real payments/forms).
