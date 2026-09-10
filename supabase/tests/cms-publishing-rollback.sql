-- Owner save/publish/read and non-member denial. Nothing commits or goes live.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';
do $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.cms_memberships where active and role in ('owner','super_admin') limit 1;
  if owner_id is null then raise exception 'An active owner is required'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
end $$;
set local role authenticated;
do $$
declare saved record; published record;
begin
  select * into saved from public.cms_save_content_revision('home', '{"qa":"rollback-only"}'::jsonb, 'QA rollback only');
  if saved.revision_id is null then raise exception 'Draft was not saved'; end if;
  select * into published from public.cms_publish_content_revision(saved.revision_id);
  if published.published_revision_id is distinct from saved.revision_id then raise exception 'Publication mismatch'; end if;
  if not exists(select 1 from public.content_pages where slug='home' and published_revision_id=saved.revision_id) then raise exception 'Published pointer not readable'; end if;
end $$;
reset role;
do $$
declare outsider uuid := gen_random_uuid();
begin
  while exists(select 1 from public.cms_memberships where user_id=outsider) loop outsider := gen_random_uuid(); end loop;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', outsider, 'role', 'authenticated')::text, true);
end $$;
set local role authenticated;
do $$
begin
  begin
    perform public.cms_save_content_revision('home', '{}'::jsonb, 'must fail');
    raise exception 'Non-member could save';
  exception when insufficient_privilege then null; end;
  begin
    perform public.cms_publish_content_revision(gen_random_uuid());
    raise exception 'Non-member could publish';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: owner draft/publish/read and non-member RPC denial; all changes rolled back' as result;
