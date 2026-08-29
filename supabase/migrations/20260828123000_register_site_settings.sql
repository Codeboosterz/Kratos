-- Shared presentation copy. Navigation routes and verified contact values stay code-owned.
insert into public.content_pages (slug, title)
values ('site-settings', 'Header & footer')
on conflict (slug) do update set title = excluded.title;
