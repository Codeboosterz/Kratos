# 12 — Design direction

## Personality

Disciplined, direct, premium, athletic, credible, personal.

## Tokens

| Role | Value | Use |
| --- | --- | --- |
| carbon | #080A08 | main background |
| charcoal | #121510 | cards and elevated surfaces |
| charcoal-soft | #1A1D18 | inputs/secondary cards |
| off-white | #F4F6EF | primary text |
| muted | #A8A99F | secondary text |
| Kratos lime | #A9CF68 | one primary action, selected state, key proof |
| equipment orange | #F06A22 | tiny photographic/icon accent only |
| border | rgba(244,246,239,0.14) | quiet structure |

## Typography

- Display: Barlow Condensed ExtraBold or an approved licensed equivalent; uppercase; optional italic for action headlines.
- Body/UI: Inter.
- Never use distressed/grunge type for forms, navigation, prices, or body text.
- Preserve clear Dutch diacritics and apostrophes.

## Layout

- Desktop max content width: 1440 px with 64–80 px outer padding.
- Mobile horizontal padding: 20–24 px.
- Marketing hero: roughly 55/45 copy/image split.
- One dominant lime CTA per viewport.
- Use 12-column desktop and 4-column mobile grids.
- Cards use 16–20 px radius, 1 px neutral border, and restrained shadow.

## Imagery

- Omar or the program subject is the protagonist.
- Dark gym or home-training environment; realistic warm skin; controlled rim light.
- Lime appears as reflected atmosphere or UI overlay, never radioactive fog.
- Orange remains tied to equipment.
- Website hero photos contain no embedded marketing text.
- Lock identity to one canonical reference after client approval.

## Motion

- Sticky intake CTA: 24 px slide plus opacity, 320 ms, strong deceleration.
- Section reveals: optional 12–20 px movement, 400–550 ms, once only.
- No looping glow, bouncing buttons, cursor hijacking, horizontal scroll tricks, or mobile parallax.
- Honor reduced motion.

## Forms and checkout

- Persistent labels; no placeholder-only fields.
- Minimum 44 px targets, preferably 52–56 px for primary controls.
- Inline field errors plus an error summary.
- Order total remains visible without obscuring form content.
- Never use countdowns, fake live-purchase notices, preselected add-ons, or hidden fees.

## States

- Loading: skeletons matching final geometry.
- Empty: explain why and offer a next step.
- Error: plain-language recovery without raw provider details.
- Disabled: visible reason and intake/contact alternative.
- Success: only after authoritative server confirmation.

## What not to do

- Do not use the supplied posters as full-page backgrounds.
- Do not put every heading in lime.
- Do not combine grunge, neon gaming, glassmorphism, and heavy glow.
- Do not create fake transformation photos or dashboard metrics.
- Do not present “detox” or guaranteed progress as evidence-based fact.

## Implementation — 2026-08-21

Tokens and components are implemented in `app/globals.css`; Barlow Condensed and Inter are local package fonts. Motion is restricted to the sentinel-driven sticky intake CTA and honors reduced-motion preferences.

## Owner CMS direction — client confirmed 2026-08-21

- The current public website is the visual source of truth and must not be replaced by the last ZIP's alternate public/CMS direction.
- CMS palette reuses `--carbon`, `--charcoal`, `--charcoal-soft`, `--off-white`, `--muted`, and `--lime` exactly.
- CMS navigation is limited to: Overzicht, Website, Trajecten, Media, Aanvragen, Instellingen.
- Inter is used for interface text. Barlow Condensed italic uppercase is reserved for major page headings.
- The CMS prioritizes tasks over analytics. It must not invent counts, recent changes, timestamps, or provider status.
- Every save and publish flow distinguishes concept, preview, and live state in plain Dutch.
- Stitch project: `246290204144160391`; design system: `3889512355704354260`.
- Approved structural screens: Overview desktop `99642521ba6244e0a2257bce1e622f6c`, Website editor desktop `7f83d3cb5daf424d8b32e9d7a82ac302`, Overview mobile `6ae6e023e57043f18d069be0ceb0189f`.

## CMS overview refinement — 2026-08-28

- Preserve Barlow Condensed/Inter and the carbon/lime identity while adopting the reference dashboard's compact bento hierarchy.
- Use four first-glance KPI cards, one primary green card, soft 16–18 px radii, quiet borders and one consistent icon family.
- Show only exact CMS values: built-in plus uploaded media, published/registered pages, active/registered products, operational actions and provider states.
- Prefer labelled progress bars and a text-backed integration ring over unlabeled decorative charts.
- Keep the utility search functional and route-based; every card and status panel must have an actual CMS destination.
- Stack to two columns below 1320 px and one column for dense modules on small screens, with 44 px minimum controls and reduced-motion-safe transitions.
