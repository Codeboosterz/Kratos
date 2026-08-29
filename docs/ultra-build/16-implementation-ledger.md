# 16 — Implementation ledger

| Slice | State | Notes |
| --- | --- | --- |
| Repository/bootstrap | implemented | Next.js 16/TypeScript/Tailwind v4; legacy files preserved |
| Design tokens/components | implemented | responsive carbon/lime system and local fonts |
| Marketing shell/routes | implemented | all canonical routes, 404/error, metadata, sitemap/robots |
| Product registry | implemented/gated | server-owned Zod-validated JSON; prices remain null |
| Trainerize redirects | implemented/gated | ten exact URLs validated; mappings unresolved so starts disabled |
| Intake flow | implemented/gated | three steps, Zod, rate limit, idempotency, retry; destination unconfigured |
| Free tools | implemented/gated | deterministic BMI/calorie calculations are live; Claude explanations remain credential-gated |
| Stripe checkout | implemented/gated | Checkout Sessions + Payment Element; verified server data required; labelled fixture tested |
| Webhook/order persistence | implemented/gated | durable, idempotent Stripe fulfillment is migration- and credential-gated |
| Legal/contact | implemented/draft | substantive draft policy pages and verified public contact only |
| Tests/QA | passed | latest verification is recorded below; build/lint/typecheck pass |
| Deployment | not_started | not requested |
| 2026 editorial shell | implemented | cohesive Barlow Condensed/Inter system, black/lime/off-white alternation and enlarged section rhythm |
| Homepage long-form story | implemented | marquee, mission, community grid, faith section, Omar band, review rail, direction cards and CTA |
| Werkwijze route | implemented | typewriter/slide heading, process timeline and accessible feature sections |
| Over Omar long-form route | implemented | hero, principles, coaching story, timeline, belief strip and CTA |
| Trajectory detail family | implemented | shared full detail template for all eight product slugs with benefits, process, coach, FAQ and summary |
| Homepage CMS expansion | implemented | owner-editable mission, faith and Omar copy plus replaceable section images |
| CMS route registry | implemented | migration registers all major public pages for stable revision identities |
| Community reveal | implemented | exact scoped GSAP/ScrollTrigger center-out 3×5 sequence; CMS-editable media and reduced-motion/mobile fallbacks |
| Results editorial | implemented | split hero, three-step method, labelled illustrative progress board, context panel and controlled story rail |
| Tools editorial | implemented/gated | split hero, locked tool cards, limitations, pathway and CTA; calculations remain unapproved |
| Production deployment | live | Vercel deployment Ready at `https://kratosfitness.be`; local env files excluded |
| Supabase production | connected/gated | dedicated project is configured for the existing CMS; the new operations migration still requires coordinated activation |
| CMS operations dashboard | implemented/gated | API slots, Vault refs, provider health and OpenRouter credit/usage metrics; migration activation required |
| Products and private PDFs | implemented/gated | validated private uploads, server-rendered Claude/Sol PDFs, draft approval boundary |
| Stripe fulfillment | implemented/gated | signature verification, durable event idempotency, orders, entitlements and recovery links |
| Resend inbox | implemented/gated | transaction mail, verified inbound webhook, delivery status and owner replies |
| Trainerize API | implemented/gated | durable provisioning queue; verified Studio/Enterprise endpoint URLs required |
| CMS/free-tool AI | implemented/gated | strict structured output, no publish rights, deterministic server recomputation |
| Operations monitoring | implemented | failed webhooks, mail, AI, Trainerize and entitlement metrics plus recovery routes |
| 2026-08-28 verification | passed | 44 tests, 12 Playwright checks, lint, typecheck, production build, zero runtime audit findings |
| CMS overview redesign | implemented/live | reference-led utility header, active navigation, live KPI/progress/integration/work-queue modules; all visible controls route to working CMS destinations |
| CMS overview data contract | implemented/tested | 139 bundled assets plus uploads, page/product status, order/inbox/monitor issue counts and integration health derived server-side; 4 summary unit tests |

User-owned dirty hero frames, `public/index.html`, PDFs, and `public/images/` were not overwritten.
