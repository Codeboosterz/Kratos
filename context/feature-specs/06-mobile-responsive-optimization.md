# Unit 06 — Mobile Responsive Optimization

## Status

Complete locally; not deployed.

## Goal

Make the existing public website and owner CMS feel deliberate and reliable on
small screens without redesigning the approved desktop layouts or changing any
data, authentication, intake, Calendly, or publishing behavior.

## Audited Baseline

- Public routes fit the viewport, but horizontal rails expose native browser
  scrollbars and footer links do not consistently meet the 44px touch target.
- The intake introduction and four-step indicator consume too much of the first
  mobile viewport before the current form step appears.
- Free-tools inputs render below 16px on phones, which reduces legibility and can
  trigger automatic zoom in iOS Safari.
- The CMS navigation and page tabs are correctly swipeable, but expose native
  horizontal scrollbars.
- The appointments and website-editor routes can exceed a 375px viewport because
  nested flex/grid content retains a wider intrinsic size.
- Several CMS controls are visually smaller than 44px and use sub-16px form text.

## Functional Requirements

1. Public and CMS documents must not create accidental horizontal page scroll at
   320px, 375px, 430px, or 768px widths.
2. Intentional horizontal rails must remain keyboard- and touch-scrollable while
   hiding decorative native scrollbars.
3. Public footer links and interactive CMS controls must expose at least a 44px
   touch target on phone breakpoints.
4. Text-entry controls on phone breakpoints must use a computed font size of at
   least 16px.
5. The mobile intake layout must retain all four steps while compacting the hero
   copy and stepper so the current form card enters the first viewport sooner.
6. CMS repeatable editor cards must collapse to one column on phones and every
   grid/flex child must be allowed to shrink with `min-width: 0`.
7. The appointments calendar may keep its intentional internal 760px canvas, but
   the surrounding document and toolbar must fit the viewport.
8. Desktop layout, content hierarchy, existing animation behavior, and reduced
   motion behavior must remain unchanged.

## Design Contract

- Preserve Kratos carbon, off-white, lime, Barlow Condensed, and existing card
  system; this is a responsive refinement, not a visual rebrand.
- Use one-column phone layouts with 20px outer gutters.
- Keep swipeable navigation and carousels obvious through clipped neighboring
  content rather than a persistent native scrollbar.
- Keep controls at least 44px high and avoid text smaller than 16px inside mobile
  form controls.
- Validate portrait widths at 320px, 375px, and 430px, plus 768px tablet and one
  short mobile landscape viewport.

## Implementation Boundary

### In scope

- Responsive rules in `app/globals.css`.
- Mobile regression contracts in `tests/unit/mobile-responsive.test.ts` and the
  existing Playwright responsive coverage.
- Context/build tracking updates for this unit.

### Out of scope

- CMS or public content changes.
- New media, new animation libraries, or changes to the Faith & Fitness story.
- Calendly, Supabase, authentication, Resend, database, or API changes.
- Desktop redesign or provider deployment.

## Acceptance Criteria

- Public `/`, `/trajecten`, `/intake`, `/resultaten`, `/gratis-tools`, and
  `/contact` have no document-level horizontal overflow at 375px.
- CMS `/beheer`, `/beheer/afspraken`, `/beheer/inbox`, `/beheer/website`,
  `/beheer/producten`, and `/beheer/instellingen` have no document-level overflow
  in an authenticated 375px viewport.
- Filter rails, CMS navigation, CMS tabs, client stories, and calendar canvases
  remain swipeable and do not show a native scrollbar.
- Mobile free-tools and CMS text inputs/selects compute to 16px and primary touch
  controls are at least 44px.
- The intake current-step heading is visible substantially earlier than the live
  baseline while the progress state remains understandable.
- Unit, lint, typecheck, production build, E2E, and local visual checks pass.

## Implementation Checklist

- [x] Audit representative live public and authenticated CMS routes at 375px.
- [x] Record responsive requirements before implementation.
- [x] Add failing mobile CSS contracts.
- [x] Implement responsive CSS refinements.
- [x] Run targeted and full validation.
- [x] Inspect the local preview at phone, tablet, and landscape widths.
