# 08 — Action registry

| Action ID | Visible labels | Input | Result | Failure/disabled behavior |
| --- | --- | --- | --- | --- |
| NAV_HOME | logo | none | / | never disabled |
| NAV_TRAJECTORIES | Trajecten, Bekijk trajecten | optional category | /trajecten | never disabled |
| NAV_RESULTS | Resultaten, Bekijk resultaten | none | /resultaten | never disabled |
| NAV_OMAR | Over Omar | none | /over-omar | never disabled |
| OPEN_INTAKE | Plan een intake, Volgende stap | intake draft | /intake or next step | preserve values; show field errors |
| SHOW_STICKY_INTAKE | Plan een intake | intersection state | animated sticky CTA | hidden on blocked routes/reduced motion |
| FILTER_PRODUCTS | category tabs | allowed category | URL-backed category view | empty-state message |
| OPEN_PRODUCT | Bekijk traject | product slug | product detail | inactive product returns not found |
| START_PRODUCT | Start mijn traject | product | external plan or internal checkout | disabled if mapping/payment unavailable; offer intake |
| OPEN_TRAINERIZE_PLAN | Bekijk programma | verified configured URL | safe external navigation | never construct URL from user input |
| OPEN_CHECKOUT | Veilig betalen | product slug | server creates session | configuration/error message; no fake success |
| SUBMIT_PAYMENT | Veilig betalen — amount | Stripe client secret | processing/redirect | retain recoverable state; prevent duplicates |
| VERIFY_CHECKOUT | automatic success-page load | session identifier | verified order result | show pending/failed, never paid by query alone |
| OPEN_POST_PURCHASE_INTAKE | Vul mijn intake in | verified product/order reference | /intake | intake still available without order data |
| RUN_MACRO_TOOL | Start QuickScan | local validated values | local estimate | explain validation; no persistence |
| RUN_MEAL_TOOL | Maak mijn plan | local validated values | local plan | explain limits; no health guarantee |
| SUBMIT_INTAKE | Verstuur intake | validated intake | submitted record/notification | retryable error; preserve values |
| OPEN_CONTACT | Neem contact op | none | /contact | provide email/phone fallback |
| SAVE_COOKIE_PREFS | Voorkeuren opslaan | consent choices | persisted preference | essential cookies remain described |

## Common action states

- idle
- hover
- keyboard focus
- loading
- success persisted
- recoverable failure
- terminal failure
- disabled with visible reason

## Implementation — 2026-08-21

`src/domain/actions.ts` is the executable registry for navigation, filtering, product start, intake submission, checkout creation/status, and cookie preferences. Each entry records capability, states, server operation, outcomes, retry/idempotency, event, and test ID.
