# Unit 10: Community Photo Refresh

## Goal

Fill the homepage community reveal with the supplied real community photos,
preserve the centre deadlift image, and increase the grid footprint by 1.5%.

## Source of Truth

- Current user comments on `NIET ALLEEN BIJ KRATOS` and 12 supplied JPGs.
- Existing 15-tile, five-column reveal, with centre tile at zero-based index 7.
- Previous user-supplied coaching photos may complement the 12 new photos.
- Six context documents and existing CMS image URL editing/publishing flow.

## Scope and design

- Use all 12 new community photographs plus two previously supplied coaching
  photographs for 14 unique surrounding images. Preserve `mission_image_url`.
- Copy originals without pixel edits; let Next Image serve optimized derivatives
  and set CSS focal points for clean landscape card crops. No face/body retouching.
- Raise desktop grid maximum width from 1180px to 1197.7px (+1.5%), capped by
  its container. Apply the same 1.015 factor to the compact maximum width.
  Preserve existing tile aspect ratio, gaps, caption and animation timing.
- Mobile/tablet regression test exposed that the unpinned compact section ends
  before the reveal can show its photos. Below 901px show the complete static
  grid/caption; use GSAP matchMedia cleanup when crossing the breakpoint.
  Keep desktop timing and sticky geometry unchanged.
- Preserve all 15 CMS positions. Explain that position 8 uses the mission image.
- Upgrade only the exact legacy stock/default image array when reading old CMS
  revisions. Custom image selections must not be overwritten.

## Out of Scope

- Centre image replacement, Faith story changes, hero, packages, providers,
  database writes, unrelated user files, and production deployment.
- A 1.5x/150% enlargement or a broader section redesign was not requested.

## Architecture and files

- `src/content/community-media.ts`: shared default image paths and focal points.
- `src/cms/home.ts`: defaults and narrowly matched legacy-default upgrade.
- `components/editorial-motion.tsx`: focal points and responsive reveal setup;
  unchanged desktop GSAP timeline, fully visible compact grid.
- `components/cms/home-editor.tsx`: centre slot clarification.
- `app/globals.css`: container-capped grid size adjustment.
- `public/images/community/`: original JPG copies; no existing images overwritten.
- `tests/unit/community-media.test.ts`, `tests/e2e/community-media.spec.ts`:
  asset completeness, CMS customisation, centre preservation and responsive layout.
- Generated media inventory updated only by the existing build script.

## Implementation Plan

1. Write failing asset/schema/layout tests.
2. Add images, defaults, focal points and bounded CSS changes.
3. Verify all files load, all 15 tiles render, and the centre remains unchanged.
4. Check scroll/reverse/next-section handoff and desktop/mobile crops.
5. Run typecheck, lint, unit tests, production build and browser tests; preview.

## Dependencies

None. Existing Next Image handles delivery optimization.

## Photo provenance

All files below are byte-identical copies from `/Users/denzil/Downloads/`.
The destination directory is `public/images/community/`. The two coaching
images complement the 12 new outdoor photographs; no generated images are used.

| Destination | Supplied file |
| --- | --- |
| partner-stretch.jpg | 99ae1f25-c9dd-418f-8ec2-4359c05371b5.JPG |
| medicine-ball.jpg | 8e4370f0-a635-477f-9511-b015f7bdeee2.JPG |
| coach-guidance.jpg | 096e2efb-c53a-4c0b-b42a-e080d3b03b0b.JPG |
| team-lunges.jpg | 789423ad-4ebe-413b-afde-906caa295225.JPG |
| stretch-smile.jpg | 951b442e-607b-40ee-9612-0ab9b76d43af.JPG |
| outdoor-warmup.jpg | 52c85b03-f0a4-4b90-8d02-0f2b90c03f8c.JPG |
| coached-row.jpg | db71865e-800b-49dd-90b5-23099e768bcb.JPG |
| team-recovery.jpg | dab52c52-5a78-4116-b5ec-041b13586f22.JPG |
| outdoor-lunge.jpg | 189f3100-c46a-4ec6-ad6f-29585becc869.JPG |
| overhead-stretch.jpg | ad8ecb3c-be9e-4d6d-99db-421ce42d7f1f.JPG |
| agility-drill.jpg | d5fe89b5-d7d9-4ed6-b614-f3832711ec71.JPG |
| coach-focus.jpg | 4b85446a-d016-4205-897a-03c6b20f874a.JPG |
| partner-mobility.jpg | cdae5021-78de-418f-b82c-dc5afba8e690.JPG |
| coached-press.jpg | 07ff895b-f666-4052-90a9-fa11b0214d12.JPG |

## Verification

- [x] All 12 new and two complementary images fill the surrounding slots.
- [x] Original centre and custom CMS selections preserved.
- [x] Size adjustment is 1.5%, not 1.5x, with no horizontal overflow.
- [x] Tests first, then passing unit/type/lint/build/browser checks.
- [x] Local desktop/mobile preview inspected and screenshot recorded.
- [x] Tracker updated; live publication status stated explicitly.

## Verified outcome — 7 September 2026

- `cmp` verified all 14 copies are identical to supplied source files.
- Typecheck, lint, 82 unit tests, production build (47 pages), and all 23
  browser tests passed. The mobile visibility defect was reproduced by failing
  browser tests before the responsive animation correction.
- Desktop 2013×1604, phone 375×900 and tablet 800×900 browser evidence is in
  `artifacts/qa/community-photos-{desktop,375,800}.png`. All 15 images loaded;
  the centre remained `/images/omar-deadlift.jpg`. Existing scroll/reverse,
  desktop breakpoint and Faith handoff tests passed.
- Local fixture preview opened at `http://127.0.0.1:3200/` and visually inspected
  in the in-app browser with the completed grid visible. No production app,
  CMS revision or database was modified.
- Existing unrelated Faith image LCP-priority warning remains queued for the
  Unit 09 polish pass; it is not caused by the new community assets.
