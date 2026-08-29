# UI Context

## Theme

Preserve the existing premium Kratos carbon/lime visual language. Public intake
uses clear progressive disclosure; the CMS uses a dense but calm operations UI.

## Colors

Reuse existing CSS variables and approved tokens:

| Role | Value |
| --- | --- |
| Carbon | `#080A08` |
| Charcoal | `#121510` |
| Soft charcoal | `#1A1D18` |
| Off-white | `#F4F6EF` |
| Muted | `#A8A99F` |
| Lime | `#A9CF68` |
| Error | `#F06A22` |

## Typography

- Barlow Condensed for public display headings.
- Inter for body copy and CMS controls.

## Layout and Components

- One primary lime action per task area.
- Visible labels, inline errors, and top-level error summaries.
- Calendar: desktop month/week/agenda controls; mobile agenda-first layout.
- Lead detail: list/detail pattern with explicit statuses and contact actions.
- CMS percentages: accessible SVG progress rings with a visible numeric value; compact and large variants share one primitive.

## Motion

- 150–300ms transform/opacity transitions only.
- Motion communicates step or panel state and respects reduced motion.
- Progress-ring entry animation may animate SVG stroke offset for up to 700ms and becomes static under `prefers-reduced-motion`.

## Responsive Rules

- Verify 375, 768, 1024, and 1440px widths.
- No horizontal page overflow.
- Touch targets are at least 44px high.

## Accessibility

- Use semantic step lists with `aria-current="step"`.
- Move focus to the active heading after step changes.
- Announce submission/validation results without color-only meaning.
- Calendar entries and status filters remain keyboard reachable.

## References

- Existing Kratos public/CMS system is the visual source of truth.
- 21st.dev Event Manager informs calendar information density and view switching, not provider ownership.
