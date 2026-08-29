# 05 — Data model

## Product

| Field | Rule |
| --- | --- |
| id | generated immutable ID |
| slug | unique, immutable after publication |
| name | verified display name |
| category | personal_training, online, bundle, duo, home_workout, transformation |
| priceCents | nullable until verified; server owned |
| currency | EUR |
| priceStatus | verification_required, verified, archived |
| checkoutMode | trainerize_external, stripe_internal, disabled |
| trainerizePlanId | nullable relation to configured external plan |
| stripePriceId | nullable secret-adjacent server value, never editable by browser |
| active | server-controlled publication state |
| image | approved asset path |

## TrainerizePlan

| Field | Rule |
| --- | --- |
| id | stable local key |
| planGUID | unique supplied identifier |
| url | exact allowlisted URL |
| productSlug | nullable until confirmed |
| status | mapping_required, verified, disabled |

## IntakeSubmission

| Field | Rule |
| --- | --- |
| id | generated |
| goal | allowlisted enum |
| experienceLevel | allowlisted enum |
| preferences | validated structured data |
| name/email/phone | sensitive, encrypted in transit and access-limited |
| consentVersion | immutable at submission |
| status | started, submitted, contacted, archived |
| createdAt | immutable |

## Order

| Field | Rule |
| --- | --- |
| id | generated |
| productId | immutable product reference |
| amountCents/currency | copied from server-owned verified price |
| stripeCheckoutSessionId | unique |
| status | pending, paid, failed, refunded, cancelled |
| customer contact | minimum required fields only |
| createdAt/updatedAt | audited timestamps |

## PaymentEvent

- Unique Stripe event ID.
- Event type and processing status.
- Raw event should not be broadly queryable; retain according to policy.
- Never log secret keys or full payment details.

## Implementation — 2026-08-21

Product, Trainerize, intake, and checkout contracts are runtime-validated. Durable intake/order/webhook entities remain repository boundaries because no database is connected; fixtures store only deterministic references/status and never form content.
