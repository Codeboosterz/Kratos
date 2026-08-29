-- Kratos owner CMS: authenticated access, immutable revisions, publishing and media.
-- All Data API grants are explicit to remain compatible with Supabase's 2026 defaults.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.cms_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'owner', 'editor')),
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.content_pages(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  change_summary text check (change_summary is null or char_length(change_summary) <= 240),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  unique (page_id, version)
);

alter table public.content_pages
  add constraint content_pages_published_revision_id_fkey
  foreign key (published_revision_id)
  references public.content_revisions(id)
  on delete set null
  deferrable initially deferred;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8388608),
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  focal_x numeric(5, 2) not null default 50 check (focal_x between 0 and 100),
  focal_y numeric(5, 2) not null default 50 check (focal_y between 0 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.cms_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  object_type text not null,
  object_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index content_revisions_page_created_idx
  on public.content_revisions (page_id, created_at desc);
create index content_revisions_status_created_idx
  on public.content_revisions (status, created_at desc);
create index content_revisions_created_by_idx
  on public.content_revisions (created_by);
create index content_revisions_published_by_idx
  on public.content_revisions (published_by);
create index media_assets_created_by_idx
  on public.media_assets (created_by);
create index media_assets_active_created_idx
  on public.media_assets (created_at desc)
  where archived_at is null;
create index cms_audit_events_actor_created_idx
  on public.cms_audit_events (actor_id, created_at desc);
create index cms_audit_events_object_idx
  on public.cms_audit_events (object_type, object_id, created_at desc);

create or replace function private.is_cms_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.cms_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.active
        and membership.role in ('super_admin', 'owner', 'editor')
    );
$$;

create or replace function private.is_cms_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.cms_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.active
        and membership.role in ('super_admin', 'owner')
    );
$$;

create or replace function private.is_cms_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.cms_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.active
        and membership.role = 'super_admin'
    );
$$;

revoke all on function private.is_cms_editor() from public, anon, authenticated;
revoke all on function private.is_cms_owner() from public, anon, authenticated;
revoke all on function private.is_cms_super_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_cms_editor() to authenticated;
grant execute on function private.is_cms_owner() to authenticated;
grant execute on function private.is_cms_super_admin() to authenticated;

alter table public.cms_memberships enable row level security;
alter table public.content_pages enable row level security;
alter table public.content_revisions enable row level security;
alter table public.media_assets enable row level security;
alter table public.cms_audit_events enable row level security;

create policy "members can view their own membership"
on public.cms_memberships for select to authenticated
using (((select auth.uid()) = user_id and active) or (select private.is_cms_super_admin()));

create policy "super admins can add cms members"
on public.cms_memberships for insert to authenticated
with check ((select private.is_cms_super_admin()));

create policy "super admins can update cms members"
on public.cms_memberships for update to authenticated
using ((select private.is_cms_super_admin()))
with check ((select private.is_cms_super_admin()));

create policy "super admins can remove cms members"
on public.cms_memberships for delete to authenticated
using ((select private.is_cms_super_admin()) and user_id <> (select auth.uid()));

create policy "published pages are public"
on public.content_pages for select to anon
using (published_revision_id is not null);

create policy "cms members can view pages"
on public.content_pages for select to authenticated
using ((select private.is_cms_editor()));

create policy "published revisions are public"
on public.content_revisions for select to anon
using (
  exists (
    select 1
    from public.content_pages as page
    where page.published_revision_id = content_revisions.id
  )
);

create policy "cms members can view revisions"
on public.content_revisions for select to authenticated
using ((select private.is_cms_editor()));

create policy "cms members can view media"
on public.media_assets for select to authenticated
using ((select private.is_cms_editor()));

create policy "cms members can register media"
on public.media_assets for insert to authenticated
with check (
  (select private.is_cms_editor())
  and created_by = (select auth.uid())
);

create policy "cms members can edit media metadata"
on public.media_assets for update to authenticated
using ((select private.is_cms_editor()))
with check ((select private.is_cms_editor()));

create policy "cms owners can remove media metadata"
on public.media_assets for delete to authenticated
using ((select private.is_cms_owner()));

create policy "cms members can view audit history"
on public.cms_audit_events for select to authenticated
using ((select private.is_cms_editor()));

revoke all on table public.cms_memberships from anon, authenticated;
revoke all on table public.content_pages from anon, authenticated;
revoke all on table public.content_revisions from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;
revoke all on table public.cms_audit_events from anon, authenticated;

grant select on table public.content_pages, public.content_revisions to anon;
grant select on table public.cms_memberships, public.content_pages, public.content_revisions,
  public.media_assets, public.cms_audit_events to authenticated;
grant insert, update, delete on table public.cms_memberships to authenticated;
grant insert, update, delete on table public.media_assets to authenticated;

create or replace function public.cms_save_content_revision(
  target_slug text,
  revision_content jsonb,
  revision_summary text default null
)
returns table (revision_id uuid, revision_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_page_id uuid;
  next_version integer;
  new_revision_id uuid;
begin
  if caller_id is null or not private.is_cms_editor() then
    raise exception 'CMS access denied' using errcode = '42501';
  end if;

  if revision_content is null
    or jsonb_typeof(revision_content) <> 'object'
    or octet_length(revision_content::text) > 65536 then
    raise exception 'Invalid CMS revision content' using errcode = '22023';
  end if;

  if revision_summary is not null and char_length(revision_summary) > 240 then
    raise exception 'Revision summary is too long' using errcode = '22001';
  end if;

  select page.id into target_page_id
  from public.content_pages as page
  where page.slug = target_slug
  for update;

  if target_page_id is null then
    raise exception 'Unknown CMS page' using errcode = 'P0002';
  end if;

  select coalesce(max(revision.version), 0) + 1 into next_version
  from public.content_revisions as revision
  where revision.page_id = target_page_id;

  insert into public.content_revisions (
    page_id, version, status, content, change_summary, created_by
  ) values (
    target_page_id,
    next_version,
    'draft',
    revision_content,
    nullif(btrim(revision_summary), ''),
    caller_id
  ) returning id into new_revision_id;

  update public.content_pages
  set updated_at = now()
  where id = target_page_id;

  insert into public.cms_audit_events (
    actor_id, action, object_type, object_id, metadata
  ) values (
    caller_id,
    'revision.saved',
    'content_revision',
    new_revision_id,
    jsonb_build_object('page_slug', target_slug, 'version', next_version)
  );

  return query select new_revision_id, next_version;
end;
$$;

create or replace function public.cms_publish_content_revision(target_revision_id uuid)
returns table (published_revision_id uuid, published_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_page_id uuid;
  target_version integer;
  previous_revision_id uuid;
begin
  if caller_id is null or not private.is_cms_owner() then
    raise exception 'Only an active CMS owner can publish' using errcode = '42501';
  end if;

  select revision.page_id, revision.version
  into target_page_id, target_version
  from public.content_revisions as revision
  where revision.id = target_revision_id
    and revision.status = 'draft'
  for update;

  if target_page_id is null then
    raise exception 'Draft revision not found' using errcode = 'P0002';
  end if;

  select page.published_revision_id into previous_revision_id
  from public.content_pages as page
  where page.id = target_page_id
  for update;

  update public.content_revisions
  set status = 'archived'
  where page_id = target_page_id
    and id <> target_revision_id
    and status in ('draft', 'published');

  update public.content_revisions
  set status = 'published', published_at = now(), published_by = caller_id
  where id = target_revision_id;

  update public.content_pages
  set published_revision_id = target_revision_id, updated_at = now()
  where id = target_page_id;

  insert into public.cms_audit_events (
    actor_id, action, object_type, object_id, metadata
  ) values (
    caller_id,
    'revision.published',
    'content_revision',
    target_revision_id,
    jsonb_build_object(
      'version', target_version,
      'previous_revision_id', previous_revision_id
    )
  );

  return query select target_revision_id, target_version;
end;
$$;

revoke all on function public.cms_save_content_revision(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.cms_publish_content_revision(uuid) from public, anon, authenticated;
grant execute on function public.cms_save_content_revision(text, jsonb, text) to authenticated;
grant execute on function public.cms_publish_content_revision(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "cms members can list site media"
on storage.objects for select to authenticated
using (bucket_id = 'site-media' and (select private.is_cms_editor()));

create policy "cms members can upload site media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and (select private.is_cms_editor())
  and owner_id = (select auth.uid())::text
);

create policy "cms members can replace site media"
on storage.objects for update to authenticated
using (bucket_id = 'site-media' and (select private.is_cms_editor()))
with check (
  bucket_id = 'site-media'
  and (select private.is_cms_editor())
  and owner_id = (select auth.uid())::text
);

create policy "cms members can delete owned site media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'site-media'
  and (select private.is_cms_editor())
  and (
    (select private.is_cms_owner())
    or owner_id = (select auth.uid())::text
  )
);

with inserted_page as (
  insert into public.content_pages (slug, title)
  values ('home', 'Homepage')
  on conflict (slug) do nothing
  returning id
), home_page as (
  select id from inserted_page
  union all
  select id from public.content_pages where slug = 'home'
  limit 1
), inserted_revision as (
  insert into public.content_revisions (
    page_id, version, status, content, change_summary, published_at
  )
  select
    home_page.id,
    1,
    'published',
    jsonb_build_object(
      'eyebrow', 'Persoonlijke coaching',
      'title_line_1', 'Word',
      'title_line_1_accent', 'sterker.',
      'title_line_2', 'Blijf',
      'title_line_2_accent', 'sterker.',
      'intro', 'Training en coaching met een helder plan dat past bij jouw doel, niveau en dagelijks leven.',
      'primary_cta_label', 'Plan een intake',
      'primary_cta_href', '/intake?source=home-hero',
      'secondary_cta_label', 'Bekijk onze werkwijze',
      'secondary_cta_href', '/resultaten',
      'note', 'Eerst jouw startpunt en doel helder krijgen.',
      'hero_image_url', '/img/hero-header.jpg',
      'hero_image_alt', '',
      'motion_hero_accents', 'slide',
      'motion_goal_cards', 'blink',
      'motion_method_line_1', 'typewriter',
      'motion_method_line_2', 'slide_up',
      'motion_results_accents', 'slide',
      'motion_client_stories', 'scroll'
    ),
    'Initiële goedgekeurde homepage-inhoud',
    now()
  from home_page
  where not exists (
    select 1
    from public.content_revisions as existing
    where existing.page_id = home_page.id
  )
  returning id, page_id
)
update public.content_pages as page
set published_revision_id = inserted_revision.id, updated_at = now()
from inserted_revision
where page.id = inserted_revision.page_id
  and page.published_revision_id is null;
