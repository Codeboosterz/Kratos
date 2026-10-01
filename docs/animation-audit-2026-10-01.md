# Responsive animation audit — 1 October 2026

## Findings and changes

| Surface | Finding | Change / verification |
| --- | --- | --- |
| Homepage image sequence | Desktop-only media query; mobile canvas hidden. | Enable portrait mobile scrubbing with shorter travel, DPR capped at 1, smaller retained frame window, existing concurrency cap and poster fallback. Restore original frame when scrolling upward. Compact landscape uses readable normal flow. |
| Image loading after restored scroll | Delayed anchor warmup could replace the current frame request queue. | Warm the current target window when the visitor has already scrolled. |
| Homepage community grid | Mobile immediately showed the static final state; desktop resize ranges could become stale in WebKit. | Gentle reversible per-tile reveal on mobile, without a long pin. Refresh after fonts, viewport changes and actual mission-section size changes; clean listeners/observer/timer on unmount. |
| Faith & Fitness | Six-chapter story was mixed into the coaching homepage; phone layout was a vertical stack. | Move to existing /community route. Retain desktop filmstrip and approved photos. Native mobile horizontal snap rail with swipe, keyboard focus and previous/next controls. No autoplay or forced vertical scrolling. |
| Reduced motion | Marquee continued moving slowly; phone and desktop hero differed. | Stop marquee and show readable static hero. Existing desktop community/story direct scroll treatment retained. |
| Editorial headings/reveals, process timeline, result stories | Existing one-time entry effects remain visible after reversal. | Public page scroll and browser suites cover remaining routes; no additional changes required. |
| Mobile navigation, route entry and history | Scroll restoration can occur after route DOM becomes ready. | Test orientation, route cleanup and history restoration before evaluating a subsequent user scroll. |

## Community content

“Faith. Fitness. Community.” presents a separate community/event branch. Event descriptions follow the client's screenshots: shared workouts, challenges, teamwork, faith/inspiration, connection and varying editions/locations. Primary links follow existing Instagram and Facebook destinations recovered from the original site. No event dates, bookings, charitable registration or donations are invented. The event page has no coaching intake CTA. Exact former CMS default wording upgrades on read; custom images/copy and revision history are retained. Story photos still use the existing home CMS record; publishing it also invalidates /community.

## Evidence

- 265 unit/integration tests; lint and typecheck pass.
- Production build passes.
- Full Chromium browser suite: 37 passing checks.
- Chromium/WebKit checks cover forward/reverse scrubbing, all desktop story photos, mobile slide controls, resizing, orientation, route navigation and reduced motion.
- Public-route down/up smoke matrix: /werkwijze, /resultaten, /over-omar, /trajecten and /community at 390px and 1440px in both engines; no page errors or document overflow.
- WebKit iPhone 13 emulation: hero and community visuals inspected; tapping next slide advances to 2/6 without page errors.
- Local production preview: http://127.0.0.1:3550/community. Screenshots and browser reports are under artifacts/qa/unit31.

Browser emulation verifies behavior and geometry, not a physical-device frame-rate guarantee. No real intake, email, payment or booking was created during QA.
