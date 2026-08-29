# 09 — State machines

## Intake

~~~mermaid
stateDiagram-v2
    [*] --> Goal
    Goal --> Preferences: valid goal
    Preferences --> Goal: back
    Preferences --> Contact: valid preferences
    Contact --> Preferences: back
    Contact --> Submitting: valid contact and consent
    Submitting --> Submitted: server accepted
    Submitting --> Contact: recoverable error
    Submitted --> [*]
~~~

## Implementation — 2026-08-21

Intake implements step validation, submitting, success, and retryable failure while retaining values. Checkout implements unavailable, creating, Payment Element, verifying, paid, unpaid, expired, failed, and unknown states plus an explicitly labelled fixture branch.

Draft state may be kept in session storage, but sensitive contact data should not persist longer than needed without consent.

## Product purchase

~~~mermaid
stateDiagram-v2
    [*] --> ProductViewed
    ProductViewed --> MappingRequired: no verified destination
    ProductViewed --> TrainerizeRedirect: verified external mode
    ProductViewed --> CheckoutReady: verified Stripe mode
    CheckoutReady --> Processing: submit once
    Processing --> PaymentPending: provider processing
    Processing --> PaymentFailed: provider failure
    PaymentFailed --> CheckoutReady: retry
    PaymentPending --> Paid: signed webhook and server verification
    Paid --> IntakeOffered
    TrainerizeRedirect --> [*]
    MappingRequired --> IntakeOffered
    IntakeOffered --> [*]
~~~

## Sticky CTA

~~~mermaid
stateDiagram-v2
    [*] --> Hidden
    Hidden --> Visible: hero CTA leaves viewport
    Visible --> Hidden: hero CTA re-enters
    Visible --> Hidden: final CTA enters
    Hidden --> Hidden: intake or checkout route
~~~
