# Unit 07: Faith Story Stepper and Layout

## Goal

Replace the Faith & Fitness story's legacy progress rail with a reusable
stepper that stays synchronized with the existing scroll timeline, while using
the pinned viewport more intentionally by enlarging the filmstrip and removing
excess empty space.

## Source of Truth

- User request: replace the six-step progress bar with the supplied stepper pattern.
- Browser comments: reduce white space in the pinned Faith & Fitness section and enlarge the scrolling images.
- Locked references: the existing six CMS-managed chapters, copy, imagery, and GSAP scroll sequence.
- Existing files: `components/faith-scroll-story.tsx`, `app/globals.css`, and `tests/e2e/faith-story.spec.ts`.
- Context files: the repository's six-file implementation context.

## Scope

- Add a reusable stepper primitive under `components/ui`.
- Drive the stepper from the existing active Faith & Fitness story index.
- Preserve six CMS-driven steps and the current chapter/image synchronization.
- Enlarge the desktop filmstrip cards and tighten desktop pinned-section spacing.
- Keep the existing non-pinned mobile chapter flow unchanged.
- Update unit and browser acceptance coverage for the new stepper.

## Out of Scope

- CMS schema or editor changes.
- New images, copy, chapters, routes, or provider integrations.
- Changes to the community reveal, Omar section, hero, intake, or admin UI.
- Click-to-jump story navigation; scrolling remains the only story controller.
- Production deployment.

## Design

- The stepper uses six numbered circular indicators joined by separators.
- Completed steps use the Kratos lime accent and a check mark; the active step
  keeps its number, stronger outline, and `aria-current="step"`.
- The stepper is presentational in this story context so it cannot desynchronize
  the GSAP timeline.
- Desktop cards use height-led geometry so they occupy more of tall viewports
  without clipping the focused card or overlapping the next section.
- The progress row sits closer to the filmstrip, and layout padding is reduced.
- At 900px and below, the established readable chapter stack remains in use and
  the desktop stepper remains hidden.

## Architecture

- `components/ui/stepper.tsx` owns reusable state and semantic visual primitives.
- `components/faith-scroll-story.tsx` owns the controlled active step because it
  already owns the scroll animation lifecycle.
- GSAP updates React only when the chapter index changes, not on every scroll frame.
- `app/globals.css` owns Kratos-specific presentation; no shadcn initializer or
  theme rewrite is allowed.
- No data, route, server/client boundary, or persistence changes are introduced.

## Implementation Plan

1. Add failing source and browser contracts for the controlled stepper and tighter filmstrip geometry.
2. Add the reusable stepper primitive and minimal class-name utility.
3. Replace the legacy rail markup and timeline fill with the controlled stepper.
4. Refine only the Faith story desktop geometry and responsive breakpoint styles.
5. Run unit, type, lint, browser, and production-build checks; preview locally.

## Files to Create or Modify

- `components/ui/stepper.tsx` — reusable stepper primitive.
- `lib/utils.ts` — minimal shared `cn` helper required by the primitive.
- `components/faith-scroll-story.tsx` — controlled story stepper integration.
- `app/globals.css` — Kratos stepper and enlarged desktop filmstrip styling.
- `tests/unit/faith-stepper.test.ts` — TDD source contracts.
- `tests/e2e/faith-story.spec.ts` — scroll synchronization and geometry coverage.
- `context/feature-specs/00-build-plan.md` — unit status.
- `context/progress-tracker.md` — current work, decisions, validation, and preview.
- `context/ui-context.md` — public story stepper/layout convention.

## Dependencies

- No new packages. `lucide-react` is already installed and supplies the check
  and loading icons without adding a second icon package.

## Verification Checklist

- [x] Six stepper indicators render from CMS-managed steps.
- [x] Active/completed/inactive state stays synchronized with scroll position.
- [x] The focused card is visibly larger and remains fully contained.
- [x] The progress row sits closer to the filmstrip with less unused space.
- [x] Mobile chapter flow is unchanged.
- [x] Neighboring pinned sections do not overlap.
- [x] No TypeScript errors.
- [x] Lint passes.
- [x] Unit and relevant browser tests pass.
- [x] Production build passes.
- [x] App launches and is visually inspected locally.
- [x] `context/progress-tracker.md` is updated.
