# Unit 25: Inbox history access

## Goal / source
Unit 19 found that Inbox silently loaded only 200 intakes and 100 email threads.
The user's requirement to see all submitted forms needs reachable older records.

## Scope / design
Paginate intakes and email threads in batches of 50. Apply lead/search filters
in the database before pagination. Preserve filters across page links and open
deep-linked records independently of the current page. Display accurate totals,
Brussels timestamps and explicit database errors instead of an empty inbox or
an unfounded migration instruction. Reuse existing CMS styles and RLS.

## Architecture / files / plan
1. Test pure page/search/href helpers and the filtered Supabase query contract.
2. Add `src/cms/inbox-query.ts`; update the protected Inbox page only.
3. Verify typecheck/tests and live read-only owner page after deployment.

## Dependencies / exclusions
No new dependencies, schema changes, customer edits or emails. This adds inbox
history navigation, not a CRM redesign or mailbox import.

## Acceptance
- [x] Older intakes/threads reachable; filters applied before range
- [x] Deep links work outside the loaded page
- [x] Errors visible, dates use Europe/Brussels, totals accurate
- [x] 10 focused tests, full 206 tests, typecheck and lint pass
