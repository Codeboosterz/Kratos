# Trainerize plan mapping workbook

The client supplied eleven links; the first link was repeated, leaving ten unique plan GUIDs. Dynamic plan names, prices, and billing cadences could not be reliably verified from the public pages during this handoff. Do not infer a mapping from URL order.

The runtime source of truth is `config/trainerize-plans.json`. Complete the fields there only after the account owner confirms this worksheet.

| Plan ID | Plan GUID / exact URL | Confirmed product slug | Public name | Price + cadence | Verified by/date |
| --- | --- | --- | --- | --- | --- |
| 01 | [d88de104776240209064501fb8260dfb](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=d88de104776240209064501fb8260dfb) | — | — | — | — |
| 02 | [c41894155fe74fc7b895e08a8fc5d988](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=c41894155fe74fc7b895e08a8fc5d988) | — | — | — | — |
| 03 | [c88c79ae54ad4751be594de0a01f1156](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=c88c79ae54ad4751be594de0a01f1156) | — | — | — | — |
| 04 | [0f313f62a8c94f0fa47f09070c3e02a9](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=0f313f62a8c94f0fa47f09070c3e02a9) | — | — | — | — |
| 05 | [e5682fcf5e8540b5b308c7769c1d8e4d](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=e5682fcf5e8540b5b308c7769c1d8e4d) | — | — | — | — |
| 06 | [c7c25c9fee464b978dbcb14e854cd960](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=c7c25c9fee464b978dbcb14e854cd960) | — | — | — | — |
| 07 | [0e617145e8a44f819057aa62bf3d5e21](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=0e617145e8a44f819057aa62bf3d5e21) | — | — | — | — |
| 08 | [c62f2a4dbf0a45f8ad18b203e8262dfa](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=c62f2a4dbf0a45f8ad18b203e8262dfa) | — | — | — | — |
| 09 | [f458a5b4b28746ad9faeb0610a005651](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=f458a5b4b28746ad9faeb0610a005651) | — | — | — | — |
| 10 | [428c9f0211d74043aa389274e4c5c70f](https://www.trainerize.me/profile/kratoscoaching1/?planGUID=428c9f0211d74043aa389274e4c5c70f) | — | — | — | — |

## Activation checklist per link

- Account owner confirms the exact public product name.
- Product slug exists and is active in the server registry.
- Price, currency, billing cadence, tax wording, and cancellation terms are authoritative.
- The exact URL is allow-listed and tested on desktop and mobile.
- Button label and destination match the checkout mode.
- Analytics record the internal product ID, not personal data or the full query URL.
- If a future Stripe product replaces the link, the old Trainerize URL remains documented for fulfilment/rollback rather than being silently discarded.
