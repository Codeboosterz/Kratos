# Source notes

Accessed during the design handoff on 2026-08-19. Recheck provider documentation at implementation time because SDKs, APIs, and account capabilities can change.

## Client and live-site sources

- [Kratos Fitness live site](https://kratosfitness.be/) — existing positioning, visual identity, contact flow, and on-site claims; claims remain subject to client approval.
- [Existing services page](https://kratosfitness.be/diensten.html) — current session-price statements and services structure; the €300 10-session total is an arithmetic/current-site fixture that must be reconfirmed before publishing or creating a Stripe Price.
- The nine files under `assets/reference-campaigns/` — client-supplied product/art-direction references, preserved byte-for-byte.
- The ten unique URLs in `config/trainerize-plans.json` — client-supplied destinations. Their plan names, prices, mapping, and account behavior remain unverified.

## Implementation authorities

- [Stripe Elements and Checkout Sessions](https://docs.stripe.com/payments/elements) — Payment Element/Express Checkout and server-created Checkout Sessions.
- [Stripe webhook verification](https://docs.stripe.com/webhooks) — signature verification, raw request body, endpoint handling, and event delivery behavior.
- [Motion `useInView`](https://motion.dev/docs/react-use-in-view) and [Motion `AnimatePresence`](https://motion.dev/docs/react-animate-presence) — recommended sticky-CTA observation and presence animation.
- [GSAP React integration](https://gsap.com/resources/React/) and [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) — alternative implementation for an existing GSAP stack.

Official provider documentation overrides this handoff if a later version differs. Implementers must record any resulting architecture change in `docs/ultra-build/decision-log.md`.
