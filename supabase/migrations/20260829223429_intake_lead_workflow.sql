-- Owner-facing intake lead workflow.
-- Public submissions continue through the trusted /api/intake route only.

alter table public.intake_requests
  add column lead_status text not null default 'new'
    check (lead_status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  add column read_at timestamptz,
  add column read_by uuid references auth.users(id) on delete set null,
  add column internal_note text not null default ''
    check (char_length(internal_note) <= 2000);

create index intake_requests_lead_status_created_idx
  on public.intake_requests (lead_status, created_at desc);
create index intake_requests_unread_created_idx
  on public.intake_requests (created_at desc)
  where read_at is null;

drop policy if exists "cms owners manage intake workflow" on public.intake_requests;
create policy "cms owners manage intake workflow" on public.intake_requests
  for update to authenticated
  using ((select private.is_cms_owner()))
  with check ((select private.is_cms_owner()));

revoke all on table public.intake_requests from anon, authenticated;
grant select, update on table public.intake_requests to authenticated;
