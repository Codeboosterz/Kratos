# Unit 23: CMS form recovery

## Goal / source of truth
Repair verified CMS upload/AI form dead ends from Unit 19 and the user's request
to connect every form correctly. Preserve the approved design and schema.

## Scope / design
PDF upload and generation must validate an existing product before storage or
paid AI work; every asset link, usage and job write must succeed before success.
Malformed bodies return safe errors. Media/PDF/AI buttons recover after network
or non-JSON responses. Native form values remain present on recoverable errors.
Clipboard failure gives useful feedback. Retain existing private storage rules.

## Architecture / files
`app/api/cms/{digital-assets,pdf/generate,ai/assist}/route.ts` validate and check
authoritative writes. `components/cms/{media-library,product-operations,ai-assistant}`
use try/catch/finally and prevent native form reset on errors. No new libraries.

## Plan
1. Add failing route tests for denied requests, invalid bodies, missing products,
   failed job creation and failed product linking (mock storage/providers).
2. Implement guarded handlers and client error recovery.
3. Run tests/typecheck/lint and include in final build/browser checks.

## Out of scope
No real uploads, AI cost, publishing, migration or credentials. AI remains a
review-only drafting utility, not automatic website publication.

## Verification
- [x] Invalid/missing targets do not reach storage or AI
- [x] Authoritative writes checked; success only after link/job persistence
- [x] Network failures release busy states and preserve input
- [x] 10 focused tests pass; full 196 tests, typecheck and lint pass
