# Unit 02: Four-Stage Public Intake

## Goal

Make the public intake a clear four-stage experience that stores the lead before
optional booking and remains fully usable without Calendly credentials.

## Scope

- Dynamic accessible progress UI.
- `product-detail` source attribution.
- Step-level/blur validation, focus management, and safe session draft recovery.
- Booking step with configured Calendly embed or honest fallback.
- Final confirmation only after booking confirmation when Calendly is configured.

## Out of Scope

- Native Calendly Scheduling API UI.
- Changing intake question schema or consent meaning.

## Design

Preserve the existing carbon/lime form shell. Use one primary CTA, persistent
labels, visible focus, 44px controls, and reduced-motion-safe transitions.

## Verification Checklist

- [ ] Source and step behavior tests written first
- [ ] Active/completed step state is accurate
- [ ] Refresh preserves non-sensitive choices/contact but excludes free-text note
- [ ] Missing Calendly does not block success
- [ ] Public responsive/E2E checks pass
