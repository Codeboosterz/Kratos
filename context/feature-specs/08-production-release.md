# Unit 08: Production Release

## Goal

Release the already validated mobile responsive refinements and Faith & Fitness
stepper/layout work to the production Kratos website through the existing
`main` → Vercel deployment flow.

## Source of Truth

- User request: push the completed changes live now.
- Release candidates: Units 06 and 07.
- Existing deployment: GitHub `main` connected to Vercel project `kratos-fitness`.
- Validation record: `context/progress-tracker.md`.

## Scope

- Re-run final local release checks.
- Commit only the validated Unit 06–07 application, test, and context files.
- Push the scoped commit to `origin/main`.
- Wait for the connected Vercel production deployment to become ready.
- Verify the production homepage and CMS entry point.
- Record the commit, deployment status, and production verification.

## Out of Scope

- `public/index.html` and unrelated dirty or untracked user files.
- Supabase migration application.
- Calendly, Resend, Stripe, or other provider configuration.
- New product, content, media, layout, or animation changes.
- Destructive Git operations or history rewriting.

## Design

No design work is introduced. Production must match the locally approved and
validated Unit 06 mobile treatment and Unit 07 Faith & Fitness stepper.

## Architecture

- GitHub `origin/main` remains the deployment source.
- Vercel's existing Git integration builds and aliases the production artifact.
- The release contains no schema or environment-variable changes.
- Rollback remains available by reverting the release commit or promoting the
  previous ready Vercel deployment.

## Implementation Plan

1. Audit and explicitly stage only the release file allow-list.
2. Run typecheck, lint, unit tests, browser tests, and production build.
3. Commit and push to `origin/main` without force.
4. Inspect the resulting Vercel deployment until it is ready or fails.
5. Verify production routes and update release documentation.

## Files to Create or Modify

- `context/feature-specs/08-production-release.md` — release boundary and checks.
- `context/feature-specs/00-build-plan.md` — release status.
- `context/progress-tracker.md` — release commit, deployment, and verification.
- Validated Unit 06–07 files only — production release payload.

## Dependencies

- None.

## Verification Checklist

- [x] Release staging excludes unrelated user files.
- [x] Typecheck, lint, unit tests, browser tests, and production build pass.
- [x] Scoped release commit `6518a38` is created on `main`.
- [x] `origin/main` receives the commit without force.
- [x] Vercel production deployment `dpl_A8di1A2eVcaCKHHdM2La8QKuuEse` reaches `READY`.
- [x] `https://kratosfitness.be/` serves the new release.
- [x] CMS entry point remains reachable/protected.
- [x] Progress tracker records the production release.
