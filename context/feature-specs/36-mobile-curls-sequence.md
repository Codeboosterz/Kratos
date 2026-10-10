# Unit 36 — mobile-only native-quality curl sequence

Use the supplied portrait curl MP4 for the existing homepage hero at widths up
to 900px only. Preserve desktop frames, copy, CTA destinations and motion timing.
Extract every source frame at native 720 × 1280 using lossless WebP, no scaling,
interpolation, sharpening or lossy re-encoding. Keep a reproducible extraction
script and manifest containing source hash, dimensions, frame count and timing.

Adapt scroll-world principles to the existing canvas engine rather than mounting
a second page-wide engine: poster-first rendering, bounded frame loading/cache,
forward/reverse scroll and responsive teardown. Reduced motion and short phone
landscape retain a still with readable copy. No new generation or provider spend.

Acceptance: source/frame integrity tests, mobile-only request selection, final and
reverse frames, breakpoint cleanup, reduced-motion poster, existing desktop
regressions, type/lint/build checks. Browser QA must explicitly report any access
restriction; do not claim real-device Safari or throttled performance without it.

## Implementation and verification — 5 October 2026

Follow-up scope: repair marquee response to runtime motion-preference changes.
Additional approved scope: verify compact community grid animation and fix its
runtime preference lifecycle, preserving the unpinned mobile layout and all photos.
CUA browser access is now available. Reproduced stale marquee after switching
reduce→no-preference; replaced mount-only check with scoped GSAP matchMedia.
Verified mobile frame endpoints and reverse scroll, moving marquee, and clean
stop on reduced motion in the rebuilt preview. Temporary viewport and media
emulation restored. Initial unexecuted-browser status below is historical;
physical-device and constrained-network acceptance remain pending.

- `scripts/extract-mobile-curls.mjs` decodes native RGB PNG masters with ffmpeg,
  then converts with Sharp lossless WebP. It compares every decoded output pixel
  to its master and removes only its own temporary master directory afterward.
- All 121 outputs are 720×1280. Combined size: 64.12 MiB (average 543 KiB).
  This intentionally prioritizes the requested lossless quality over transfer
  size; it is not evidence of fast delivery on constrained cellular connections.
- Mobile retains at most nine nearby frames plus three anchors, with three
  concurrent requests. Desktop continues using its existing JPEG sequence.
- 276 unit/integration tests, typecheck, lint, whitespace checks and production
  build pass. Preview: http://127.0.0.1:3561/.
- Added browser acceptance coverage for mobile/desktop network separation,
  reverse scrub, bounded retention, breakpoint changes and reduced motion.
  Not executed because prior local-browser access was denied; no alternate
  automation surface used to bypass that restriction. Browser and physical
  phone/network acceptance remain pending. No production deployment performed.
