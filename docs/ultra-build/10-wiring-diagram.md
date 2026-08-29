# 10 — Wiring diagram

~~~mermaid
flowchart TD
    U[Visitor] --> H[Home]
    H --> R[Results]
    H --> O[Omar]
    H --> T[Trajectories]
    H --> G[Free tools]
    H --> I[Intake]
    T --> D[Product detail]
    D --> Q{Checkout mode}
    Q -->|Verified Trainerize| X[Exact external plan URL]
    Q -->|Verified Stripe| C[Internal checkout]
    Q -->|Unavailable| I
    C --> S[Server creates Checkout Session]
    S --> P[Stripe Payment Element]
    P --> W[Signed webhook]
    W --> N[Normalize idempotently]
    N --> DB[(Order store)]
    DB --> V[Server-verified success]
    V --> I
    I --> L[(Intake store or approved destination)]
    G --> I
    R --> I
    O --> I
    X --> A[Trainerize app/program]
    E[Errors] --> C
    E --> I
    ADM[Admin/config owner] --> PR[Product and URL registry]
    PR --> T
    PR --> S
~~~

## Page-level wiring index

- Home: docs/page-wiring/home.md
- Trajectories: docs/page-wiring/trajecten.md
- Product detail: docs/page-wiring/product-detail.md
- Intake: docs/page-wiring/intake.md
- Checkout and success: docs/page-wiring/checkout.md
- Results: docs/page-wiring/results.md
- Omar: docs/page-wiring/about.md
- Free tools: docs/page-wiring/tools.md
- Legal/contact: docs/page-wiring/legal-contact.md

## Error and return paths

- Product not found → not-found page → trajectories.
- Trainerize mapping missing → disabled buy action plus intake.
- Stripe unconfigured → checkout configuration notice; never render payment fields as active.
- Payment failed → checkout with preserved contact values and provider-safe error.
- Success link without verified payment → pending/not-paid screen → checkout/support.
- Intake destination unavailable → preserve values in browser and show contact fallback.

## Implementation — 2026-08-21

Controls now resolve through URL-backed filters, typed form contracts, server-owned product lookup, exact Trainerize allow-listing, Stripe Checkout Sessions, and authoritative status reads. No browser amount, Price ID, return host, or payment truth is accepted.
