-- Run as the database administrator. All fixtures and workflow edits roll back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';

do $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.cms_memberships
    where active and role in ('owner', 'super_admin') limit 1;
  if owner_id is null then raise exception 'An active owner is required for this test'; end if;
  perform set_config('kratos.qa_owner', owner_id::text, true);
  perform set_config('kratos.qa_reference', 'KRA-QA-' || upper(replace(gen_random_uuid()::text, '-', '')), true);
  if not (select relrowsecurity from pg_class where oid = 'public.intake_requests'::regclass) then
    raise exception 'Intake RLS must be enabled';
  end if;
end $$;

insert into public.intake_requests
  (reference, idempotency_key, goal, experience, training_format, availability,
   customer_name, customer_email, contact_channel, consent_version, source)
values
  (current_setting('kratos.qa_reference'), gen_random_uuid(), 'strength', 'beginner',
   'personal', 'QA rollback only', 'QA rollback only', 'qa@example.invalid',
   'email', 'qa-rollback-only', 'database-rollback-test');

do $$
begin
  if not exists (select 1 from public.intake_requests
      where reference = current_setting('kratos.qa_reference')
      and lead_status = 'new' and read_at is null and read_by is null
      and internal_note = '' and appointment_status = 'awaiting_booking') then
    raise exception 'New intake defaults are incorrect';
  end if;
  begin
    update public.intake_requests set lead_status = 'invalid'
      where reference = current_setting('kratos.qa_reference');
    raise exception 'Invalid lead status was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.intake_requests set internal_note = repeat('x', 2001)
      where reference = current_setting('kratos.qa_reference');
    raise exception 'Oversized note was accepted';
  exception when check_violation then null;
  end;
  perform set_config('request.jwt.claim.sub', current_setting('kratos.qa_owner'), true);
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', current_setting('kratos.qa_owner'), 'role', 'authenticated')::text, true);
end $$;

set local role authenticated;
do $$
declare changed integer;
begin
  if not exists (select 1 from public.intake_requests
      where reference = current_setting('kratos.qa_reference')) then
    raise exception 'Owner cannot read the intake';
  end if;
  update public.intake_requests
    set lead_status = 'contacted', internal_note = 'QA rollback only',
        read_at = now(), read_by = auth.uid()
    where reference = current_setting('kratos.qa_reference');
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Owner workflow update failed'; end if;
  if not exists (select 1 from public.intake_requests
      where reference = current_setting('kratos.qa_reference')
      and lead_status = 'contacted' and read_at is not null
      and read_by = auth.uid() and internal_note = 'QA rollback only') then
    raise exception 'Owner workflow changes were not readable';
  end if;
  if has_table_privilege(current_user, 'public.intake_requests', 'INSERT')
      or has_table_privilege(current_user, 'public.intake_requests', 'DELETE') then
    raise exception 'Authenticated users have unexpected create/delete privileges';
  end if;
end $$;

reset role;
do $$
declare non_owner_id uuid := gen_random_uuid();
begin
  while exists (select 1 from public.cms_memberships where user_id = non_owner_id) loop
    non_owner_id := gen_random_uuid();
  end loop;
  perform set_config('request.jwt.claim.sub', non_owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', non_owner_id::text, 'role', 'authenticated')::text, true);
end $$;

set local role authenticated;
do $$
declare changed integer;
begin
  if exists (select 1 from public.intake_requests
      where reference = current_setting('kratos.qa_reference')) then
    raise exception 'Non-owner can read the intake';
  end if;
  update public.intake_requests set internal_note = 'Must not save'
    where reference = current_setting('kratos.qa_reference');
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Non-owner can update the intake'; end if;
end $$;

reset role;
set local role anon;
do $$
begin
  if has_table_privilege(current_user, 'public.intake_requests', 'SELECT')
      or has_table_privilege(current_user, 'public.intake_requests', 'INSERT')
      or has_table_privilege(current_user, 'public.intake_requests', 'UPDATE')
      or has_table_privilege(current_user, 'public.intake_requests', 'DELETE') then
    raise exception 'Anonymous users have intake privileges';
  end if;
  begin
    perform 1 from public.intake_requests limit 1;
    raise exception 'Anonymous intake read was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
rollback;
select 'PASS: defaults, constraints, owner read/update, non-owner denial, anonymous denial; all fixture changes rolled back' as result;
