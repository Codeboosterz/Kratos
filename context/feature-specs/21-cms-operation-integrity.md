# Unit 21: CMS operation integrity

## Goal / source of truth
Repair the verified Media 404 and ensure CMS publication and lead updates report
only successful, authorized changes. User smoke-test/fix request of 11 September
2026, Unit 19 evidence, and the six context documents govern this work.

## Scope and design
Restore the existing Media page to source control by anchoring the root asset
ignore rule. Preserve its layout and uploads; show a useful library load error.
Require owner/super-admin for publication and validate the revision's page on
both publishing actions. Refresh all public consumers of trajectory content.
Reject lead updates when the target row is missing. No new UI design or schema.

## Architecture
Server Action role checks supplement (never replace) existing database RPC/RLS
checks. Publication invalidates homepage, catalog and product detail consumers.
Lead mutations request the affected ID so zero-row updates cannot claim success.

## Plan / files
1. Add failing integration tests for publication and zero-row lead updates, and
   a Git-ignore regression for the existing Media source route.
2. Fix `.gitignore`, the Media page, website actions and intake status actions.
3. Run focused tests, typecheck, then final full audit validation.

## Out of scope / dependencies
No credentials, remote schema changes, customer communications or upload of real
customer assets. No dependencies.

## Verification
- [x] Media page is no longer ignored; missing-library error is explicit
- [x] Editor/wrong-page publishing denied before mutation
- [x] Trajectory publication invalidates every consumer
- [x] Missing lead updates do not report success
- [x] 13 focused tests and typecheck pass
