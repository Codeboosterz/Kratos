# Unit 31 — responsive motion and separate Faith & Fitness

## Approved scope, 1 October 2026
Audit public animations on mobile and desktop, including reverse scrolling. Repair the two homepage image sequences. Remove the Faith & Fitness story from the homepage. Rework the existing /community page as the independent community/events branch using the client's supplied Dutch copy and title FAITH. FITNESS. COMMUNITY. Invite social follows for event updates, rather than a coaching intake.

## Implementation
Preserve approved product imagery, other marketing content, desktop composition and existing CMS history. Keep motion accessible and responsive, use stable viewport geometry, clean up after route and breakpoint changes. Compact devices get a shorter hero sequence and a gentle reversible unpinned grid reveal; reduced motion keeps content readable without continuous decorative movement. Retain community route and navigation. Use confirmed existing social URLs, without inventing dates or charitable/legal status.

## Verification
Browser down/up scroll, fast jumps, resize, portrait/landscape, reduced motion, route re-entry and image loading on Chromium and WebKit where available. Update obsolete homepage Faith tests to the new page boundary and verify the remaining sequences. Run typecheck, lint, unit suite, build and local visual preview before release.
