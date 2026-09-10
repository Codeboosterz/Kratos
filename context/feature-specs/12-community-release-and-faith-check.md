# Unit 12: Community Release and Next Animation Check

## Goal and source

The user approved Units 10–11 and explicitly requested publication, followed by
a check of the next animation. The next section is the Faith & Fitness story.

## Scope and design

- Release the exact approved community photos, CMS default compatibility,
  mobile gallery and pinned reveal/finale through the existing main → Vercel flow.
- Re-run the release gate and inspect the next story's six chapters, stepper,
  community handoff, release and mobile behavior. Inspection does not authorize
  a redesign or additional animation implementation.
- Preserve the centre image, all existing services, product content and providers.

## Boundaries and files

Allow-list the reviewed application changes in app/globals.css,
components/editorial-motion.tsx, components/cms/home-editor.tsx, src/cms/home.ts,
src/content/community-media.ts, public/images/community, generated media inventory,
community tests and their context/spec records.

Do not stage the unrelated public/index.html rewrite, personal/reference files,
Supabase README/tests or future product work. No migrations or provider writes.
Update this release record, build plan and progress tracker as checks complete.

## Procedure

1. Inspect the diff and remote state; run typecheck, lint, unit/browser tests and build.
2. Commit the allow-list and push main without force; verify the production commit
   reaches READY and is assigned to kratosfitness.be.
3. Inspect live photos/animation and the following Faith story; collect evidence.
4. Record the release and any next-animation findings. Keep a local preview available.

## Dependencies

None. Reuse installed tools and the configured deployment pipeline.

## Verification

- [x] Scope reviewed; unrelated work preserved.
- [x] Typecheck, lint, 82 unit tests, browser suite and production build pass.
- [x] Release pushed and production deployment verified.
- [x] Live community photos/finale verified.
- [x] Next animation desktop/mobile behavior checked; findings recorded.
- [x] Local preview available, release status and tracker updated.

## Release gate

- Typecheck, lint, 82 unit tests and production build (47 pages) passed.
- All 27 browser tests passed, including all six Faith chapter/stepper states,
  release, reduced motion, mobile and adjacent-pin non-overlap checks.
- Local Faith chapter 3 inspected visually at 2013×1604; image, rolling copy
  and stepper agree. No next-animation code changes are needed from these checks.
- The Vercel connector cannot access the configured team (403). Publication
  uses the existing authorized GitHub integration; deployment confirmation
  must come from its Vercel commit status plus live page/asset inspection.

## Deployed outcome — 7 September 2026

- Commit `9bd0b17` pushed to `origin/main` without force. Vercel deployment
  `dpl_ExjBTCJKx9uEPzy6fG8Hx9ofA8v4` reported “Deployment has completed” through
  the GitHub commit status at 10:01:36 UTC (pending at 10:01:01 UTC).
- `https://kratosfitness.be/` returned 200 with the new scene wrapper and
  community photo paths, and without the local fixture banner.
- In-browser production check at 2013×1604: all 15 photos loaded, base growth
  was 1.025, the expanded scene stayed at header top 76px with ~24px side
  margins, and no horizontal document overflow occurred.
- The next Faith story entered only after the community had left the viewport.
  Chapters 1 and 6 were visually inspected on production: image, copy and
  stepper matched, all six images loaded, and the completed pin returned to
  normal flow. Local tests cover every chapter and mobile behavior.
- No next-animation defect requiring a code change was found in these checks.
  The previously recorded Faith image LCP-priority warning remains a polish item.
- Production runtime log scan returned 403, not an empty result. Server logs,
  drains, exact provider build duration and broader monitoring remain unverified.
- Local fixture preview restarted at `http://127.0.0.1:3200/`; production tab
  left open after the final chapter. Unrelated local files remain uncommitted.
