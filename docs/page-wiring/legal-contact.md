# Contact and legal pages

Routes: `/contact`, `/privacy`, `/voorwaarden`, `/cookies`

## Shared shell wiring

| Route | Required source | Primary controls | Critical states |
| --- | --- | --- | --- |
| `/contact` | verified email, phone/WhatsApp if approved, address/service area if approved | email, call/message, intake | omit unknown channels; accessible fallback |
| `/privacy` | approved controller, purposes, bases, retention, recipients/processors, rights, contact | table of contents, contact | version/effective date required |
| `/voorwaarden` | approved commercial/legal terms | table of contents, contact | prices/refunds/cancellation must match checkout |
| `/cookies` | actual cookie inventory and consent implementation | accept/reject nonessential, granular preferences, save | default, saved, unavailable manager |

## Contact wiring

1. Render only values from a verified business-contact config.
2. Use native `mailto:` and `tel:` links only when those values are approved.
3. A contact form, if added, uses its own server validation, spam controls, success/failure states, and privacy notice; do not silently reuse the intake endpoint.
4. Business hours, response times, location, and service radius are omitted until confirmed.

## Legal and consent wiring

- Checkout links to the exact applicable terms and privacy notice near payment confirmation.
- Intake links to privacy information near submission.
- Cookie controls gate nonessential scripts by category; “reject” must be as accessible as “accept.”
- Persist consent version and categories when a consent platform is implemented.
- Legal documents require qualified client/legal approval; template text is not production approval.

## Navigation and error behavior

- Every legal page remains accessible without JavaScript and uses the normal header/footer.
- Anchor table-of-contents links update focus correctly.
- Missing legal copy is a release blocker, not a reason to publish lorem ipsum or dead `#` links.
- `/diensten` permanently redirects to `/trajecten`; update internal links and sitemap to the canonical route.
