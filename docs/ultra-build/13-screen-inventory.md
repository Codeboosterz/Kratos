# 13 — Screen inventory

| # | Artboard | Route/state | Asset | Main controls | Status |
| --- | --- | --- | --- | --- | --- |
| 01 | Home desktop | / | assets/mockups/01-home-desktop.png | intake, results, goal cards | designed |
| 02 | Home mobile | / mobile | assets/mockups/02-home-mobile.png | intake, results, menu | designed |
| 03 | Trajectories | /trajecten | assets/mockups/03-trajecten-desktop.png | category tabs, product cards, intake | designed |
| 04 | Online coaching detail | /trajecten/premium-online-coaching | assets/mockups/04-online-coaching-detail-desktop.png | start, intake | designed |
| 05 | Checkout desktop | /checkout/transformatie-pack | assets/mockups/05-checkout-desktop.png | contact fields, Payment Element, pay | designed; provider unconfigured |
| 06 | Checkout mobile | same, mobile | assets/mockups/06-checkout-mobile.png | same controls, stacked | designed; provider unconfigured |
| 07 | Checkout success | /checkout/success | assets/mockups/07-checkout-success-desktop.png | intake, home, support | designed; server verification required |
| 08 | Intake step 1 | /intake | assets/mockups/08-intake-desktop.png | goal, experience, next | designed |
| 09 | Omar | /over-omar | assets/mockups/09-about-omar-desktop.png | intake | designed; identity lock unresolved |
| 10 | Free tools | /gratis-tools | assets/mockups/10-gratis-tools-desktop.png | QuickScan, meal plan, intake | designed |
| 11 | Results | /resultaten | assets/mockups/11-results-desktop.png | intake | designed; proof verification unresolved |
| 20 | CMS owner overview desktop | /beheer | Stitch `99642521ba6244e0a2257bce1e622f6c` | website, media, audit activity | implemented; managed Supabase project pending |
| 21 | CMS website editor desktop | /beheer/website | Stitch `7f83d3cb5daf424d8b32e9d7a82ac302` | save concept, preview, publish | implemented; managed Supabase project pending |
| 22 | CMS owner overview mobile | /beheer mobile | Stitch `6ae6e023e57043f18d069be0ceb0189f` | same owner tasks and publish confirmation | implemented; managed Supabase project pending |

## Template-driven screens not separately illustrated

- Other product-detail routes reuse artboard 04 with product content.
- Intake steps 2, 3, submitting, success, and failure follow artboard 08.
- Checkout pending, failed, expired, and unconfigured states reuse artboards 05/06.
- Contact and legal pages reuse the global shell and form/text components.
- 404 and generic error pages use the same dark shell and one recovery CTA.

## Implementation — 2026-08-21

All listed screens and honest empty/unavailable/success/failure states are present. Results uses a method-first empty state; free tools remain visibly disabled pending formula approval; checkout has normal configuration-required and labelled fixture states.

The first CMS vertical slice is implemented with Supabase Auth, Postgres revisions, Storage media, RLS and owner-only publishing. Remaining navigation destinations stay visibly unavailable until their authoritative data boundaries are implemented.
