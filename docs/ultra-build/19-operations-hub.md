# 19 — CMS operations hub

## Outcome

The CMS now owns the operational workflow without giving providers or AI permission to publish content or change deterministic calculations. Supabase is the source of truth; all provider secrets are environment-first with an encrypted Supabase Vault fallback.

## Build order delivered

1. Settings and integration-health dashboard with write-only API slots.
2. CMS products, private `digital-products` bucket, validated PDF upload, orders and entitlements.
3. Idempotent Stripe webhook fulfillment with payload fingerprinting and recoverable delivery links.
4. Resend transactional delivery, verified inbound webhook, delivery events and CMS inbox.
5. Trainerize provisioning queue and explicit Studio/Enterprise endpoint adapter.
6. Claude 4.6 CMS assistance through OpenRouter with strict structured output and no publish rights.
7. Deterministic adult BMI and calorie estimates with Claude explanation only after server recomputation.
8. Distributed hashed-key rate limits, monitoring, recovery actions and end-to-end verification.

## AI PDF providers

- Default: OpenRouter `anthropic/claude-sonnet-4.6`.
- Optional: `gpt-5.6-sol` through an explicitly configured OpenAI-compatible backend (`SOL_API_BASE_URL`, `SOL_API_KEY`, `SOL_PDF_MODEL`).
- AI generates content JSON; `pdf-lib` renders the actual PDF on the application server.
- Generated PDFs enter `draft`, while validated manual uploads enter `ready`.

## Security boundaries

- Private PDFs never receive a public URL.
- Download tokens are 256-bit random values; only SHA-256 hashes are stored.
- Signed storage URLs expire after 60 seconds.
- Stripe and Resend webhooks require signature verification and durable idempotency records.
- Integration secrets are unreadable to the browser and CMS users; only a service-role RPC can decrypt them.
- AI receives approved text or deterministic results, never authority over publishing, payments or formulas.
- Rate-limit identifiers are hashed before persistence.

## Activation gate

The operations migration is committed but not applied by this repository build. Apply `supabase/migrations/20260828104426_cms_operations_hub.sql`, configure the server-only environment slots, then run provider test-mode checks before activating product status.
