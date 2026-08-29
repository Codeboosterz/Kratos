# 14 — Control wiring matrix

| Screen | Exact control | Type | Target/action | Server operation | Required state | Reconciliation |
| --- | --- | --- | --- | --- | --- | --- |
| Global | Kratos logo | link | NAV_HOME | none | any | matched |
| Global | Resultaten | link | /resultaten | none | any | matched |
| Global | Werkwijze | anchor | #werkwijze or documented home section | none | home; otherwise route plus anchor | needs implementation |
| Global | Trajecten | link | /trajecten | none | any | matched |
| Global | Over Omar | link | /over-omar | none | any | matched |
| Global | Plan een intake | link | OPEN_INTAKE | none | any marketing route | matched |
| Home | Bekijk resultaten | link | /resultaten | none | any | matched |
| Home | Afvallen | link | /trajecten?doel=afvallen | none | any | matched |
| Home | Spieropbouw | link | /trajecten?doel=spieropbouw | none | any | matched |
| Home | Fit & sterk | link | /trajecten?doel=fit-sterk | none | any | matched |
| Marketing | sticky Plan een intake | animated link | SHOW_STICKY_INTAKE | none | hero and final CTA out of view | specified |
| Trajectories | category tabs | tabs/links | FILTER_PRODUCTS | none | valid category | matched |
| Trajectories | Bekijk traject | link | OPEN_PRODUCT | resolve slug | active product | matched |
| Trajectories | Plan een intake | link | OPEN_INTAKE | none | any | matched |
| Product | Start mijn traject | button/link | START_PRODUCT | resolve checkout mode | verified destination | conditional |
| Product | Eerst een intake plannen | link | OPEN_INTAKE | none | any | matched |
| Intake | goal cards | radio group | update draft | none | step 1 | matched |
| Intake | experience | radio group | update draft | none | step 1 | matched |
| Intake | Volgende stap | button | OPEN_INTAKE next | validate locally/server schema | valid step | matched |
| Intake | Terug | button | previous step | none | step > 1; at step 1 route back | matched |
| Intake | Verstuur intake | button | SUBMIT_INTAKE | persist/forward | step 3 valid and consented | template required |
| Tools | Start QuickScan | button | RUN_MACRO_TOOL | none by default | valid local inputs | matched |
| Tools | Maak mijn plan | button | RUN_MEAL_TOOL | none by default | valid local inputs | matched |
| Checkout | contact fields | form | checkout draft | none until submit | product active | matched |
| Checkout | Payment Element | provider component | SUBMIT_PAYMENT | Checkout Session client secret | Stripe configured | configuration_required |
| Checkout | Veilig betalen — €300 | button | SUBMIT_PAYMENT | confirm through Stripe | verified product/session | configuration_required |
| Checkout | Terug naar traject | link | product detail | none | any | matched |
| Success | Vul mijn intake in | link | OPEN_POST_PURCHASE_INTAKE | read verified order reference | paid | matched |
| Success | Terug naar home | link | / | none | any | matched |
| Success | Neem contact op | link | /contact | none | any | matched |
| Results | Plan een intake | link | OPEN_INTAKE | none | any | matched |
| Omar | Plan een intake | link | OPEN_INTAKE | none | any | matched |
| Footer | Privacy | link | /privacy | none | any | missing live; required |
| Footer | Voorwaarden | link | /voorwaarden | none | any | missing live; required |
| Footer | Cookies | link/button | /cookies or preferences | SAVE_COOKIE_PREFS | any | required |

No enabled control may ship with a placeholder target or empty handler.

## Reconciliation — 2026-08-21

- All global, marketing, product, intake, checkout, results, Omar, contact, footer, and cookie controls are implemented and browser-checked.
- Tool calculation controls are intentionally disabled with a visible formula-approval reason.
- Product starts are disabled until a verified Trainerize mapping or Stripe Price exists.
- The former “€300” control exists only as “Testbedrag — geen productieprijs” in fixture mode.
