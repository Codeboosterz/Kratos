# Kratos Fitness

## Overview

Kratos Fitness is a conversion-first coaching website with an owner CMS. The
current local release includes the intake-to-operations flow and a refined
Faith & Fitness scroll story whose CMS-managed chapters use a larger filmstrip
and an accessible, scroll-controlled stepper.

## Target Users

- Prospective coaching clients completing the public intake.
- The Kratos owner or super admin managing leads and appointments.

## Goals

1. Make the four-stage intake progress clear and resilient.
2. Surface every submitted intake inside the protected CMS.
3. Link confirmed Calendly appointments to their originating intake.
4. Continue accepting leads when Calendly is not configured.
5. Keep the six Faith & Fitness chapters visually synchronized while making
   better use of tall desktop viewports.

## Core User Flow

1. A visitor chooses a goal and experience level.
2. The visitor supplies coaching preferences and availability.
3. The visitor provides contact details and consent.
4. The server stores the intake and, when configured, shows Calendly booking.
5. The CMS owner reviews the lead and any linked appointment.

## Feature Categories

- Public intake stepper and validation.
- Supabase lead workflow and access control.
- CMS intake inbox and Resend follow-up.
- CMS Calendly appointment calendar and reconciliation.

## Scope

### In Scope

- Intake source attribution, draft recovery, focus and validation behavior.
- Lead read/status/note workflow in the CMS.
- Linked appointment details, filtering, and responsive calendar/list views.
- Optional Calendly fallback until credentials are supplied.
- Faith & Fitness stepper presentation and desktop filmstrip geometry.

### Out of Scope

- Configuring client Calendly credentials.
- Native scheduling through the Calendly Scheduling API.
- Changing marketing animations outside the scoped Faith & Fitness stepper,
  product content, pricing, or public media.
- Drag-and-drop calendar mutations that bypass Calendly.

## Success Criteria

1. A valid intake is stored exactly once and appears in the CMS.
2. Missing Calendly credentials never prevent intake submission.
3. Signed booking/cancellation data links to the correct intake.
4. Owner-facing PII remains protected by auth, grants, and RLS.
5. Unit, integration, E2E, type, lint, and production-build checks pass.
6. Faith & Fitness scroll state, stepper state, and active card remain aligned
   across all six desktop chapters without disturbing the mobile chapter flow.
