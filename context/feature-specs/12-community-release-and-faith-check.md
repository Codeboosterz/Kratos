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
- [ ] Release pushed and production deployment verified.
- [ ] Live community photos/finale verified.
- [ ] Next animation desktop/mobile behavior checked; findings recorded.
- [ ] Local preview available, release status and tracker updated.

## Release gate

- Typecheck, lint, 82 unit tests and production build (47 pages) passed.
- All 27 browser tests passed, including all six Faith chapter/stepper states,
  release, reduced motion, mobile and adjacent-pin non-overlap checks.
- Local Faith chapter 3 inspected visually at 2013×1604; image, rolling copy
  and stepper agree. No next-animation code changes are needed from these checks.
- The Vercel connector cannot access the configured team (403). Publication
  uses the existing authorized GitHub integration; deployment confirmation
  must come from its Vercel commit status plus live page/asset inspection.
