# Unit 20: Framework security patch

## Goal
Remove the verified Next.js and sharp advisories without changing app behavior.

## Source of Truth
- User's 11 September security/fix request and Unit 19 npm audit.
- Official GHSA-2xp9-vwfh-vxw4, GHSA-p293-qw3h-jr36 and GHSA-rgj7-g3m4-5g8c.
- Existing six context documents and Next.js 16 upgrade documentation.

## Scope
Patch Next.js and matching ESLint package from 16.3.1 to 16.3.4 and resolve sharp
to a patched compatible release. Patch the affected transitive js-yaml dev
dependency to 4.3.2 as well. Preserve React and all unrelated packages.

## Out of Scope
Major upgrades, codemods (no API migration applies), UI, credentials, schema.

## Design
No visual or interaction change.

## Architecture
Same Next.js App Router/server-only boundaries. Lockfile remains reproducible.

## Implementation Plan
1. Use the failing production npm audit as the regression baseline.
2. Patch the two explicit versions and update their locked dependency tree.
3. Run audit, typecheck, lint, tests, build and browser regression.

## Files to Create or Modify
- `package.json`, `package-lock.json` — patched framework/linter/image dependency.
- Context tracker/build plan — evidence and status.

## Dependencies
Next.js 16.3.4, eslint-config-next 16.3.4; patched compatible sharp transitively.

## Verification Checklist
- [x] Full npm audit: zero known vulnerabilities, including dev dependencies
- [x] Lint and production build pass (Next 16.3.4, sharp 0.35.4)
- [x] Post-patch 163/163 unit tests and typecheck pass
- [x] Browser suite: 29/30 pass; community resize timing failure isolated for Unit 19 follow-up
- [x] Tracker updated
