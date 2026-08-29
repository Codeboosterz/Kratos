# Kratos Fitness — approved design system

> The six client-approved 9:21 boards supplied on 25 August 2026 are the visual source of truth. This file overrides generic UI search output.

## Direction

- Premium personal-coaching editorial, not a generic gym template.
- High contrast, cinematic photography, disciplined spacing, and a clear conversion path.
- Density: spacious (3/10). Motion: expressive but purposeful (8/10).
- The public site and owner CMS share the same black, off-white, and Kratos lime identity.

## Tokens

| Role | Value |
| --- | --- |
| Carbon | \`#080a08\` |
| Charcoal | \`#11140f\` |
| Off-white | \`#f4f6ef\` |
| Lime | \`#a9cf68\` |
| Bright lime | \`#b9ea68\` |
| Muted text | \`#a7aa9f\` |
| Dark border | \`rgba(244,246,239,.14)\` |
| Lime border | \`rgba(185,234,104,.45)\` |
| Display type | Barlow Condensed 700/800, uppercase |
| Body type | Inter 400/600/800 |

## Layout

- Content width: \`min(100% - 3rem, 1440px)\`.
- Long-form sections use \`clamp(6rem, 10vw, 11rem)\` vertical rhythm.
- Hero split: copy 45%, photography 55%; collapse into a single column below 900px.
- Card radii: 18–24px. Image radii: 24–34px. Buttons: 12–14px, never pill-shaped.
- Every page follows: decisive hero → proof/process → supporting narrative → conversion CTA.

## Motion

- GSAP + ScrollTrigger owns scroll-linked and pinned sequences.
- Motion/Framer Motion owns isolated entrance and interaction state.
- Homepage community reveal: one centered Omar tile scales from 3× to 1×, then the surrounding 3×5 grid blooms from the center with a restrained \`back.out(1.4)\` stagger.
- Reduced-motion users always receive the complete final layout without pinning, scrubbing, blinking, or typewriter effects.
- Animate only transform and opacity; clean up every ScrollTrigger with scoped \`useGSAP\` contexts.

## Content and trust

- Do not fabricate client names, reviews, prices, transformation metrics, or guarantees.
- Temporary imagery is explicitly replaceable through the CMS media controls.
- Health tools remain unavailable until formulas and explanatory copy are approved.
- Stripe checkout remains disabled for products without a confirmed payment configuration.

## Accessibility and responsive rules

- Maintain 4.5:1 body-text contrast and visible \`:focus-visible\` states.
- Interactive targets are at least 44px high; icons are Lucide SVGs with decorative icons hidden from assistive technology.
- Pinned community motion is desktop-only; tablets and phones get a non-pinned, shorter reveal.
- Text remains HTML text—never flattened into images.

## Forbidden

- No blue/green generic SaaS palette, glassmorphism, gratuitous gradients, fake dashboards, emojis, or unverified social proof.
- No duplicated animation libraries controlling the same property.
- No hover transforms that cause layout shift.
