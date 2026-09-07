# Unit 11: Community Reveal Finale

## Goal and source

The user approved the photos and requests a surgical animation correction:
hold the community scene as scrolling starts, reveal all images, enlarge the
complete grid to fill the available screen, hold briefly, then release the page.
Raise the grid size setting from 1.5% to 2.5% total (1.025).

## Scope and design

- Preserve all 15 images, their order, crop focal points, caption, and CMS flow.
- Keep native scroll input and the existing CSS sticky mechanism; do not freeze
  body scrolling or intercept wheel/touch/keyboard input.
- On desktop, match the sticky scene height to the viewport below the header.
  Derive the ScrollTrigger end from the actual sticky travel so release agrees
  with layout. Widen only the community stage container for the final composition.
- Sequence a short initial hold, existing centre-out reveal, all-photos-visible
  beat, viewport-fit zoom, and completed hold before release. Animate only the
  inner composition, not the sticky element. The caption travels with the grid.
- Use contain-style scaling: fill the limiting screen dimension with safe
  margins while keeping every tile and caption visible, including short screens.
  Recalculate on resize; preserve clean reverse scrolling and breakpoint cleanup.
- Raise the base maximum from 1180×1.015 to 1180×1.025. The finishing zoom is a
  separate viewport-fit phase, not a change to the photo crops or pixel data.
- Compact layouts up to 900px remain the approved static three-column grid.
  The new finale is direct scroll-controlled under reduced motion.

## Out of scope

No new photos, image edits, unrelated sections, Faith timeline edits, providers,
database/CMS writes, dependencies, publication, or broad layout redesign.

## Files / architecture

- `components/editorial-motion.tsx`: one inner scene wrapper and final GSAP phase.
- `app/globals.css`: community-only dimensions, responsive override and growth.
- Community unit/browser tests: exact base size, pinned ordering, full fit,
  release, reverse, resize and mobile regression coverage.
- Context files: record the approved correction and completed checks.

## Implementation order

1. Write failing geometry/sequence tests and update the size expectation.
2. Correct sticky geometry and append the labelled finale to the existing reveal.
3. Verify ordinary/tall/short desktop, mobile and adjacent-section handoff.
4. Run typecheck, lint, unit tests, production build and browser suite; preview.

## Dependencies

None; reuse installed GSAP, ScrollTrigger and useGSAP cleanup.

## Verification

- [x] Section stays held from the first reveal frame through final enlargement.
- [x] No enlargement begins before every photo is fully visible.
- [x] Final composition fits within the viewport and releases normally afterward.
- [x] Reverse scrolling, fast scroll, resize and phone behavior remain correct.
- [x] Assets/CMS/Faith section unchanged; no horizontal overflow.
- [x] Typecheck, lint, unit/browser tests and production build pass.
- [x] Local preview visually inspected; tracker updated; not deployed.

## Completion evidence — 7 September 2026

- Size contract and new browser sequence tests failed before implementation.
- 82 unit tests across 27 files and all 27 browser tests passed. Four new
  finale tests cover 2013×1604, 1440×900, 1280×600, resizing, reduced motion,
  reverse/release behavior and return to the static phone gallery.
- Typecheck, lint and production build passed (47 generated pages).
- Browser phase checks wait for rendered geometry/opacity, not a fixed delay,
  so GSAP scrub completion remains testable under parallel runner throttling.
- Local preview inspected interactively at `http://127.0.0.1:3200/` (1280×720):
  held opening centre image and fully enlarged 15-photo composition both fit.
  Desktop evidence: `artifacts/qa/community-finale-{2013,1440,1280}.png`.
- No publication, production data changes, photo replacement or unrelated
  section changes in this unit. Preview is ready for user review.
