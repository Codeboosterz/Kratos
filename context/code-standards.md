# Code Standards

## General

- Make surgical changes and preserve unrelated user work.
- Keep provider boundaries optional and recoverable.
- Prefer explicit states and typed allow-lists over implicit fallbacks.

## TypeScript

- Keep strict typing and avoid `any`.
- Validate browser, action, webhook, and provider input with Zod.
- Keep shared domain types in `src/schemas` or generated database types.

## Next.js

- Pages and layouts remain Server Components by default.
- Use Client Components only for browser state and interaction.
- Treat Server Actions and Route Handlers as untrusted public entry points.
- Re-check auth and authorization inside every protected mutation.

## Styling

- Reuse tokens and class conventions from `app/globals.css`.
- Use Lucide icons and visible text; no emoji controls.
- Keep controls at least 44px high with visible focus.

## API / Data

- Public intake writes remain rate-limited and idempotent.
- Never expose service-role or provider secrets to the browser.
- Put grants, RLS policies, indexes, and policy tests beside schema changes.

## Error Handling

- Preserve entered values on recoverable failure.
- State what failed and provide a safe next action.
- Never claim a booking is confirmed until provider confirmation arrives.

## Validation

- Write failing tests before implementation changes.
- Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and relevant Playwright tests.
- Launch and visually inspect a local preview.
