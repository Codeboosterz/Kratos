# Unit 05: CMS Progress Rings and Live Release

## Goal

Replace the CMS dashboard's flat percentage meters and legacy conic ring with a
reusable, accessible SVG progress-ring primitive, then publish the validated
application to the production Git/Vercel flow.

## Source of Truth

- User request: enhance the admin CMS progress rings with the supplied animated circular progress component and push the changes live.
- Locked reference: `/Users/denzil/.codex/attachments/c5130de9-4aa5-45df-8f31-4f58918c437c/pasted-text.txt`.
- Existing files: `app/beheer/(protected)/page.tsx` and `app/globals.css`.
- Context files: project, architecture, UI, code standards, workflow, and progress tracker.

## Scope

- Add `components/ui/animated-circular-progress-bar.tsx` as a reusable primitive.
- Render the three CMS publication progress values as compact circular meters.
- Replace the integration-readiness conic gradient with the same SVG primitive.
- Preserve live Supabase-derived percentages and existing dashboard links.
- Commit and push the validated application to `main`, allowing the linked Vercel project to deploy it.

## Out of Scope

- Changing the public Faith & Fitness scroll rail or its GSAP timeline.
- Applying Supabase migrations or configuring provider credentials.
- Introducing shadcn runtime dependencies or replacing the existing CSS token system.
- Modifying unrelated public media or visual sequences beyond including already-approved application assets in the live release.

## Design

- Carbon track, lime active arc, rounded endpoints, and tabular percentage text.
- Compact rings sit beside the publication labels; a large ring remains in the readiness panel.
- The exact percentage remains visible as text and is announced with `role="progressbar"`.
- Entry animation uses SVG stroke offset without layout changes and is disabled under `prefers-reduced-motion`.
- Layout remains legible at 375, 768, 1024, and 1440 pixels.

## Architecture

- The primitive is a Server Component: it has no hooks or browser-only dependencies.
- The CMS dashboard remains a Server Component and passes calculated numeric values as props.
- Styling stays in the existing global CSS system; no new package is required.
- Git push to `main` is the deployment trigger for the already-linked Vercel project.

## Implementation Plan

1. Add failing unit/source-contract tests for value normalization, semantics, and CMS adoption.
2. Build the reusable progress-ring primitive and dashboard integration.
3. Add responsive and reduced-motion CSS, then run all validation.
4. Launch and inspect a local preview.
5. Commit the application release, push `main`, and verify production state.

## Files to Create or Modify

- `components/ui/animated-circular-progress-bar.tsx` — reusable accessible SVG ring.
- `app/beheer/(protected)/page.tsx` — use rings for all CMS dashboard percentages.
- `app/globals.css` — Kratos ring styling, animation, and responsive rules.
- `tests/unit/cms-progress-ring.test.ts` — value and integration contracts.
- `context/ui-context.md` — reusable CMS indicator convention.
- `context/architecture.md` — UI primitive boundary.
- `context/progress-tracker.md` — unit and release state.

## Dependencies

- None.

## Verification Checklist

- [x] All four CMS progress values use the reusable SVG ring.
- [x] Values clamp safely between the provided min and max.
- [x] Progress semantics expose label, minimum, maximum, and current value.
- [x] Reduced-motion users receive a static readable ring.
- [x] The public Faith & Fitness rail remains unchanged.
- [x] Typecheck, lint, unit tests, E2E tests, and production build pass.
- [x] Local preview launches; route health was inspected, while the protected dashboard visual requires the authenticated production surface.
- [ ] Release is committed and pushed to `main`.
- [ ] Production deployment is verified.
- [ ] `context/progress-tracker.md` is updated.
