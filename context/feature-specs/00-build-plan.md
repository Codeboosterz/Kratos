# Build Plan

## Product

Kratos Fitness intake operations flow.

## Strategy

Build the data/security boundary before the public form and owner UI. Calendly
configuration is optional and outside this delivery.

## Units

| Unit | Name | Depends On | Status |
| --- | --- | --- | --- |
| 01 | Intake lead data boundary | Existing CMS auth | Complete |
| 02 | Four-stage public intake | Unit 01 | Complete |
| 03 | CMS intake inbox and calendar | Units 01–02 | Complete |
| 04 | Unscheduled intake visibility | Unit 03 | Complete |
| 05 | CMS progress rings and live release | Unit 04 | In progress |

## Ordering Notes

- Tests precede implementation in each unit.
- Migration is committed but not applied to production.
- Preview follows implementation and full validation.
- Production deployment follows Unit 05 validation; Supabase migrations remain a separate operation.
