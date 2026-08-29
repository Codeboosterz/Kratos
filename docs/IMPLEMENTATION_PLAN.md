# CMS implementation plan

## Stage 1 — approved public release

Preserve the current public build. Complete release checks and deploy only after explicit deployment authorization and final legal/contact/content approval.

## Stage 2 — platform gate

Confirmed: Supabase Auth + Postgres + Storage. Project creation remains pending the connected organization and cost confirmation required by Supabase.

## Stage 3 — first vertical slice

Implement authenticated `/beheer`, Home Hero draft editing, preview, publish, public projection, audit history, authorization tests, and rollback. This proves the full CMS authority boundary before expanding coverage.

## Stage 4 — expand editability

Add remaining homepage sections, other pages and SEO, trajectories, media, and intake management in that order. Keep unverified prices, claims, mappings, and integrations gated.

## Stage 5 — quality and release

Run lint, typecheck, unit/integration/E2E, authorization, accessibility, responsive visual comparison, backup/restore, and rollback checks. Deploy CMS only after every enabled control has authoritative server behavior.
