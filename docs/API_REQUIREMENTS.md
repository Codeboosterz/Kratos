# CMS API requirements

Confirmed provider: Supabase Auth + Postgres + Storage. The implementation uses cookie-based SSR sessions, explicit Data API grants, RLS on every public CMS table, immutable content revisions, owner-only publishing, and authenticated media writes.

- Authenticated session and server-side owner/editor authorization.
- Versioned page and trajectory drafts with optimistic conflict detection.
- Preview tokens that do not expose drafts publicly.
- Idempotent publish operation and append-only audit events.
- Validated media upload with size/MIME limits, alt text, focal point, and usage references.
- Intake-record access controls, retention policy, and audit logging.
- Normalized errors; no raw provider/database messages in the browser.
- Backup/restore and documented rollback for published revisions.

The first implemented vertical slice covers the homepage hero, revision history, publishing and media. Remaining page, trajectory and intake modules will reuse the same authorization and audit boundary.

## Operations provider slots

Server-only settings may be supplied through environment variables or the super-admin CMS Vault form:

- Stripe: secret key, publishable key, webhook secret.
- Resend: API key, webhook secret, verified from/reply-to addresses.
- Trainerize: API key plus account-specific verified create-client and assign-plan URLs.
- OpenRouter: inference key, management key, Claude model identifiers.
- Optional Sol: OpenAI-compatible base URL, API key and `gpt-5.6-sol` model identifier.

`SUPABASE_SECRET_KEY` is server-only and enables private storage, provider workers, Vault reads, durable rate limits and monitoring writes. It must never use a `NEXT_PUBLIC_*` name.
