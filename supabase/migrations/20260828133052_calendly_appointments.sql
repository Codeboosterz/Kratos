-- Calendly intake scheduling and the CMS appointment calendar.
-- Customer submissions and webhook payloads are written only by trusted server routes.

alter table public.integration_connections drop constraint if exists integration_connections_provider_check;
alter table public.integration_connections add constraint integration_connections_provider_check
  check (provider in ('stripe', 'resend', 'trainerize', 'openrouter', 'calendly'));

alter table public.provider_webhook_events drop constraint if exists provider_webhook_events_provider_check;
alter table public.provider_webhook_events add constraint provider_webhook_events_provider_check
  check (provider in ('stripe', 'resend', 'trainerize', 'calendly'));

insert into public.integration_connections (provider, status)
values ('calendly', 'configuration_required')
on conflict (provider) do nothing;

create table public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^KRA-[A-Z0-9-]{4,40}$'),
  idempotency_key uuid not null unique,
  goal text not null,
  experience text not null,
  training_format text not null,
  availability text not null check (char_length(availability) between 2 and 120),
  note text not null default '' check (char_length(note) <= 600),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_email text not null,
  customer_phone text not null default '' check (char_length(customer_phone) <= 30),
  contact_channel text not null check (contact_channel in ('email', 'telefoon')),
  consent_version text not null,
  product_slug text,
  source text,
  appointment_status text not null default 'awaiting_booking'
    check (appointment_status in ('awaiting_booking', 'scheduled', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_appointments (
  id uuid primary key default gen_random_uuid(),
  provider_event_uri text not null,
  provider_invitee_uri text not null unique,
  event_type_uri text,
  event_name text not null check (char_length(event_name) <= 240),
  invitee_name text not null check (char_length(invitee_name) <= 200),
  invitee_email text not null,
  status text not null check (status in ('scheduled', 'canceled')),
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  timezone text not null default 'Europe/Brussels' check (char_length(timezone) <= 100),
  location text check (location is null or char_length(location) <= 500),
  cancel_url text,
  reschedule_url text,
  intake_reference text references public.intake_requests(reference) on delete set null,
  provider_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_appointments_start_status_idx on public.calendar_appointments (start_time, status);
create index calendar_appointments_event_uri_idx on public.calendar_appointments (provider_event_uri);
create index calendar_appointments_intake_reference_idx on public.calendar_appointments (intake_reference);
create index intake_requests_created_idx on public.intake_requests (created_at desc);
create index intake_requests_appointment_status_idx on public.intake_requests (appointment_status, created_at desc);

alter table public.intake_requests enable row level security;
alter table public.calendar_appointments enable row level security;

create policy "cms owners read intake requests" on public.intake_requests
  for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners read calendar appointments" on public.calendar_appointments
  for select to authenticated using ((select private.is_cms_owner()));

revoke all on table public.intake_requests, public.calendar_appointments from anon, authenticated;
grant select on table public.intake_requests, public.calendar_appointments to authenticated;

create or replace function public.cms_store_integration_secret(target_provider text, target_credential_name text, secret_value text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  existing_secret_id uuid;
  stored_secret_id uuid;
begin
  if caller_id is null or not private.is_cms_super_admin() then
    raise exception 'CMS super admin access required' using errcode = '42501';
  end if;
  if not (
    (target_provider = 'stripe' and target_credential_name in ('secret_key', 'publishable_key', 'webhook_secret')) or
    (target_provider = 'resend' and target_credential_name in ('api_key', 'webhook_secret')) or
    (target_provider = 'trainerize' and target_credential_name in ('api_key', 'webhook_secret')) or
    (target_provider = 'openrouter' and target_credential_name in ('api_key', 'management_key')) or
    (target_provider = 'calendly' and target_credential_name in ('access_token', 'webhook_signing_key', 'scheduling_url'))
  ) then
    raise exception 'Unsupported integration credential' using errcode = '22023';
  end if;
  if secret_value is null or char_length(secret_value) < 8 or char_length(secret_value) > 8192 then
    raise exception 'Invalid integration credential' using errcode = '22023';
  end if;

  select vault_secret_id into existing_secret_id
  from public.integration_secret_refs
  where provider = target_provider and credential_name = target_credential_name;

  if existing_secret_id is null then
    select vault.create_secret(secret_value, 'kratos.' || target_provider || '.' || target_credential_name, 'Managed by Kratos CMS') into stored_secret_id;
    insert into public.integration_secret_refs (provider, credential_name, vault_secret_id, updated_by)
    values (target_provider, target_credential_name, stored_secret_id, caller_id);
  else
    perform vault.update_secret(existing_secret_id, secret_value, 'kratos.' || target_provider || '.' || target_credential_name, 'Managed by Kratos CMS');
    stored_secret_id := existing_secret_id;
    update public.integration_secret_refs set updated_by = caller_id, updated_at = now()
    where provider = target_provider and credential_name = target_credential_name;
  end if;

  update public.integration_connections
  set status = 'configuration_required', last_checked_at = null, last_error = null,
      updated_by = caller_id, updated_at = now()
  where provider = target_provider;
  insert into public.cms_audit_events (actor_id, action, object_type, metadata)
  values (caller_id, 'integration.credential_updated', 'integration', jsonb_build_object('provider', target_provider, 'credential', target_credential_name));
  return stored_secret_id;
end;
$$;

revoke all on function public.cms_store_integration_secret(text, text, text) from public, anon, authenticated;
grant execute on function public.cms_store_integration_secret(text, text, text) to authenticated;
