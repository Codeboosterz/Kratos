-- Kratos CMS operations hub: integrations, commerce, private PDFs, email and AI.
-- Secrets are encrypted with Vault and can only be read through a service-role-only RPC.

create extension if not exists supabase_vault with schema vault;

create table public.integration_connections (
  provider text primary key check (provider in ('stripe', 'resend', 'trainerize', 'openrouter')),
  status text not null default 'configuration_required' check (status in ('connected', 'not_connected', 'configuration_required', 'permission_expired', 'degraded')),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  last_checked_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 500),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.integration_secret_refs (
  provider text not null references public.integration_connections(provider) on delete cascade,
  credential_name text not null,
  vault_secret_id uuid not null unique,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (provider, credential_name)
);

create table public.cms_products (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  price_cents integer check (price_cents is null or price_cents > 0),
  currency text not null default 'eur' check (currency ~ '^[a-z]{3}$'),
  stripe_product_id text,
  stripe_price_id text,
  trainerize_plan_id text,
  digital_asset_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.digital_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  filename text not null,
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  source text not null default 'upload' check (source in ('upload', 'ai_generated')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  checksum_sha256 text check (checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.cms_products
  add constraint cms_products_digital_asset_id_fkey foreign key (digital_asset_id) references public.digital_assets(id) on delete set null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  product_id text not null references public.cms_products(id) on delete restrict,
  customer_email text not null,
  status text not null check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled', 'failed')),
  amount_total integer not null check (amount_total >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  asset_id uuid not null references public.digital_assets(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  claim_token_hash text not null unique check (claim_token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz,
  download_count integer not null default 0 check (download_count >= 0),
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.provider_webhook_events (
  provider text not null check (provider in ('stripe', 'resend', 'trainerize')),
  provider_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received', 'processing', 'completed', 'failed', 'ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (provider, provider_event_id)
);

create table public.email_threads (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'waiting', 'closed', 'spam')),
  last_message_at timestamptz not null default now(),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.email_threads(id) on delete cascade,
  provider_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender text not null,
  recipients jsonb not null check (jsonb_typeof(recipients) = 'array'),
  subject text not null,
  text_body text,
  html_body text,
  delivery_status text not null default 'queued' check (delivery_status in ('queued', 'sent', 'delivered', 'bounced', 'complained', 'suppressed', 'failed', 'received')),
  in_reply_to text,
  created_at timestamptz not null default now()
);

create table public.trainerize_provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  trainerize_plan_id text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'completed_with_warnings', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('pdf_generation', 'cms_assist', 'free_tool_explanation', 'email_draft')),
  model text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'completed_with_warnings', 'failed')),
  input_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(input_summary) = 'object'),
  output_asset_id uuid references public.digital_assets(id) on delete set null,
  error_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.ai_usage_events (
  id bigint generated always as identity primary key,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  provider text not null default 'openrouter',
  model text not null,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create table private.api_rate_limit_buckets (
  namespace text not null,
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  primary key (namespace, key_hash)
);
revoke all on table private.api_rate_limit_buckets from public, anon, authenticated;

create index orders_status_created_idx on public.orders (status, created_at desc);
create index integration_connections_updated_by_idx on public.integration_connections (updated_by);
create index integration_secret_refs_updated_by_idx on public.integration_secret_refs (updated_by);
create index cms_products_digital_asset_idx on public.cms_products (digital_asset_id);
create index cms_products_created_by_idx on public.cms_products (created_by);
create index cms_products_updated_by_idx on public.cms_products (updated_by);
create index digital_assets_created_by_idx on public.digital_assets (created_by);
create index orders_product_id_idx on public.orders (product_id);
create index entitlements_status_created_idx on public.entitlements (status, created_at desc);
create index entitlements_asset_id_idx on public.entitlements (asset_id);
create index provider_events_status_received_idx on public.provider_webhook_events (status, received_at desc);
create index email_threads_status_last_message_idx on public.email_threads (status, last_message_at desc);
create index email_threads_assigned_to_idx on public.email_threads (assigned_to);
create index email_messages_thread_created_idx on public.email_messages (thread_id, created_at);
create index trainerize_jobs_status_attempt_idx on public.trainerize_provisioning_jobs (status, next_attempt_at);
create index ai_jobs_status_created_idx on public.ai_jobs (status, created_at desc);
create index ai_jobs_output_asset_idx on public.ai_jobs (output_asset_id);
create index ai_jobs_created_by_idx on public.ai_jobs (created_by);
create index ai_usage_model_created_idx on public.ai_usage_events (model, created_at desc);
create index ai_usage_job_id_idx on public.ai_usage_events (ai_job_id);

insert into public.integration_connections (provider, status) values
  ('stripe', 'configuration_required'),
  ('resend', 'configuration_required'),
  ('trainerize', 'configuration_required'),
  ('openrouter', 'configuration_required')
on conflict (provider) do nothing;

insert into public.cms_products (id, slug, name, description, status, currency) values
  ('product-transformation-pack', 'transformatie-pack-10-sessies', 'Transformation Pack', 'Een persoonlijk traject rond training, ritme en voortgang.', 'draft', 'eur'),
  ('product-premium-online', 'premium-online-coaching', 'Premium Online Coaching', 'Structuur en persoonlijke afstemming, waar je ook traint.', 'draft', 'eur'),
  ('product-training-nutrition', 'training-voeding-bundle', 'Training + Voeding Bundle', 'Een samenhangende aanpak voor training en dagelijkse keuzes.', 'draft', 'eur'),
  ('product-duo-coaching', 'duo-coaching', 'Duo Coaching', 'Een begeleid traject voor twee trainingspartners.', 'draft', 'eur'),
  ('product-training-plan', 'jouw-trainingsschema', 'Jouw Trainingsschema', 'Een heldere trainingsstructuur die aansluit op je doel.', 'draft', 'eur'),
  ('product-hwo-beginners', 'hwo-beginners', 'HWO for Beginners', 'Een toegankelijke basis om thuis gericht te leren trainen.', 'draft', 'eur'),
  ('product-hwo-lower-body', 'hwo-lower-body-glutes', 'HWO Lower Body & Glutes', 'Een thuisprogramma met focus op het onderlichaam.', 'draft', 'eur'),
  ('product-12-weeks', '12-weken-transformatie', '12 Weken Transformatie', 'Een traject met een duidelijke periode en persoonlijke start.', 'draft', 'eur')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('digital-products', 'digital-products', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.integration_connections enable row level security;
alter table public.integration_secret_refs enable row level security;
alter table public.cms_products enable row level security;
alter table public.digital_assets enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.provider_webhook_events enable row level security;
alter table public.email_threads enable row level security;
alter table public.email_messages enable row level security;
alter table public.trainerize_provisioning_jobs enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.ai_usage_events enable row level security;

create policy "cms members read integration health" on public.integration_connections for select to authenticated using ((select private.is_cms_editor()));
create policy "super admins manage integration health" on public.integration_connections for all to authenticated using ((select private.is_cms_super_admin())) with check ((select private.is_cms_super_admin()));
create policy "super admins inspect configured secret slots" on public.integration_secret_refs for select to authenticated using ((select private.is_cms_super_admin()));
create policy "cms members read products" on public.cms_products for select to authenticated using ((select private.is_cms_editor()));
create policy "cms owners manage products" on public.cms_products for all to authenticated using ((select private.is_cms_owner())) with check ((select private.is_cms_owner()));
create policy "cms members read digital assets" on public.digital_assets for select to authenticated using ((select private.is_cms_editor()));
create policy "cms owners manage digital assets" on public.digital_assets for all to authenticated using ((select private.is_cms_owner())) with check ((select private.is_cms_owner()));
create policy "cms owners read orders" on public.orders for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners read entitlements" on public.entitlements for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners read provider events" on public.provider_webhook_events for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners read email threads" on public.email_threads for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners manage email threads" on public.email_threads for update to authenticated using ((select private.is_cms_owner())) with check ((select private.is_cms_owner()));
create policy "cms owners read email messages" on public.email_messages for select to authenticated using ((select private.is_cms_owner()));
create policy "cms owners send email messages" on public.email_messages for insert to authenticated with check ((select private.is_cms_owner()) and direction = 'outbound');
create policy "cms owners read trainerize jobs" on public.trainerize_provisioning_jobs for select to authenticated using ((select private.is_cms_owner()));
create policy "cms members read ai jobs" on public.ai_jobs for select to authenticated using ((select private.is_cms_editor()));
create policy "cms members create ai jobs" on public.ai_jobs for insert to authenticated with check ((select private.is_cms_editor()) and created_by = (select auth.uid()));
create policy "cms owners read ai usage" on public.ai_usage_events for select to authenticated using ((select private.is_cms_owner()));

create policy "cms owners view private product files" on storage.objects for select to authenticated using (bucket_id = 'digital-products' and (select private.is_cms_owner()));
create policy "cms owners upload private product files" on storage.objects for insert to authenticated with check (bucket_id = 'digital-products' and (select private.is_cms_owner()));
create policy "cms owners update private product files" on storage.objects for update to authenticated using (bucket_id = 'digital-products' and (select private.is_cms_owner())) with check (bucket_id = 'digital-products' and (select private.is_cms_owner()));
create policy "cms owners delete private product files" on storage.objects for delete to authenticated using (bucket_id = 'digital-products' and (select private.is_cms_owner()));

revoke all on table public.integration_connections, public.integration_secret_refs, public.cms_products, public.digital_assets,
  public.orders, public.entitlements, public.provider_webhook_events, public.email_threads, public.email_messages,
  public.trainerize_provisioning_jobs, public.ai_jobs, public.ai_usage_events from anon, authenticated;
grant select on table public.integration_connections, public.cms_products, public.digital_assets, public.orders, public.entitlements,
  public.provider_webhook_events, public.email_threads, public.email_messages, public.trainerize_provisioning_jobs, public.ai_jobs,
  public.ai_usage_events to authenticated;
grant select on table public.integration_secret_refs to authenticated;
grant insert, update, delete on table public.integration_connections, public.cms_products, public.digital_assets to authenticated;
grant update on table public.email_threads to authenticated;
grant insert on table public.email_messages, public.ai_jobs to authenticated;

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
    (target_provider = 'openrouter' and target_credential_name in ('api_key', 'management_key'))
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

  update public.integration_connections set status = 'configuration_required', last_checked_at = null, last_error = null, updated_by = caller_id, updated_at = now()
  where provider = target_provider;
  insert into public.cms_audit_events (actor_id, action, object_type, metadata)
  values (caller_id, 'integration.credential_updated', 'integration', jsonb_build_object('provider', target_provider, 'credential', target_credential_name));
  return stored_secret_id;
end;
$$;

create or replace function public.get_integration_secret_for_server(target_provider text, target_credential_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select secret.decrypted_secret
  from public.integration_secret_refs as reference
  join vault.decrypted_secrets as secret on secret.id = reference.vault_secret_id
  where reference.provider = target_provider and reference.credential_name = target_credential_name
  limit 1;
$$;

create or replace function public.consume_api_rate_limit(target_namespace text, target_key_hash text, target_limit integer, target_window_seconds integer)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket private.api_rate_limit_buckets%rowtype;
  window_interval interval;
begin
  if target_namespace is null or char_length(target_namespace) > 80
    or target_key_hash !~ '^[a-f0-9]{64}$'
    or target_limit < 1 or target_limit > 10000
    or target_window_seconds < 1 or target_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;
  window_interval := make_interval(secs => target_window_seconds);
  insert into private.api_rate_limit_buckets as limits (namespace, key_hash, window_started_at, request_count)
  values (target_namespace, target_key_hash, now(), 1)
  on conflict (namespace, key_hash) do update set
    request_count = case when limits.window_started_at <= now() - window_interval then 1 else limits.request_count + 1 end,
    window_started_at = case when limits.window_started_at <= now() - window_interval then now() else limits.window_started_at end
  returning * into bucket;
  return query select bucket.request_count <= target_limit,
    case when bucket.request_count <= target_limit then 0 else greatest(1, ceil(extract(epoch from ((bucket.window_started_at + window_interval) - now())))::integer) end;
end;
$$;

revoke all on function public.cms_store_integration_secret(text, text, text) from public, anon, authenticated;
grant execute on function public.cms_store_integration_secret(text, text, text) to authenticated;
revoke all on function public.get_integration_secret_for_server(text, text) from public, anon, authenticated;
grant execute on function public.get_integration_secret_for_server(text, text) to service_role;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
