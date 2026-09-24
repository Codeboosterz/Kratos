# KRATOS Unit 29 review handoff

24 September 2026. Local preview: http://127.0.0.1:3300/ . No production publication, real lead submission, email or payment.

## Customer points

| Point | Status | Review route / reason |
| --- | --- | --- |
| 1 Duo image | Gedeeltelijk | `/trajecten/duo-coaching`: old one-client photo removed. Branded slot waits for approved two-client original. |
| 2 Online image | Gedeeltelijk | `/trajecten/premium-online-coaching`: in-person photo removed. Branded slot waits for approved remote coaching original. |
| 3 Faith & Fitness distinction | Voltooid for copy, gedeeltelijk for follow flow | `/community` is explicitly events/community and separate from coaching. Verified event social URL still needed for a follow button. |
| 4 Exact title | Voltooid | `/community` and home teaser use `FAITH. FITNESS. COMMUNITY.` |
| 5 Omar story | Gedeeltelijk | `/over-omar`: real name, existing portrait, short sourced intro and route to method. Personal biography remains blocked by original PDF. |
| 6 Concrete copy | Gedeeltelijk | `/`, `/trajecten`, detail pages: clearer service forms and audience. Package-specific conditions still need client source. |
| 7 One method | Voltooid | Five-step coaching flow on `/werkwijze`; home, Omar and detail pages link to it. |
| 8 Clear services | Gedeeltelijk | Eight active routes retained, individual facts shown, selected price request works. Definitive inclusion, duration, price/unit still need approval. |
| 9 Repetition and placeholders | Voltooid within scope | Long Faith scroll, empty reviews, duplicate method lists, public integration/location placeholder messages removed from scoped routes. |
| 10 Clear visitor route | Gedeeltelijk | Home → offer → detail → selected intake works locally; complete personal story, media and event follow links await source material. |

## Evidence

- `npm run typecheck`, `npm run lint`, `npm test` (263/263), `npm run build`, `npm run test:e2e -- --workers=1` (28/28) passed after implementation and the hero animation adjustment.
- Local production preview inspected at 360, 390, 430, 768 and 1440 px: no document overflow; all visible images load. One H1 per inspected route. Axe found no serious/critical violations on the tested key pages.
- Screenshots: `artifacts/qa/unit29/{home,aanbod,duo,online,omar,werkwijze,community}-{390,1440}.png`, `home-initial-1440.png`, and `hero-{initial,middle,end}-1440.png`. The desktop hero frame and final tagline sequence were inspected in the production preview; reduced-motion mobile coverage passed.
- Source status and conflicts: `docs/kratos-content-sources.md`.

## Files in this unit

Public routes: `app/page.tsx`, `app/trajecten/[slug]/page.tsx`, `app/community/page.tsx`, `app/over-omar/page.tsx`, `app/werkwijze/page.tsx`, `app/intake/page.tsx`, `app/contact/page.tsx`, `app/resultaten/page.tsx`.

Shared content/logic: `src/content/product-details.ts`, `config/products.json`, `src/cms/site-page-definitions.ts`, `src/server/catalogue.ts`, `src/server/start-action.ts`, `src/domain/products.ts`, `src/schemas/intake.ts`, `components/intake-form.tsx`, `components/product-card.tsx`, `components/site-header.tsx`, `components/site-footer.tsx`, `components/sticky-intake-cta.tsx`, `components/home-scroll-hero.tsx`, `components/hero-first-scroll-title.tsx`, `app/globals.css`, `app/community/page.module.css`.

Validation: `tests/integration/commerce-start-action.test.ts` and the updated browser specs in `tests/e2e/`. Existing tests for removed homepage scroll scenes were replaced with acceptance coverage for the new flow.
