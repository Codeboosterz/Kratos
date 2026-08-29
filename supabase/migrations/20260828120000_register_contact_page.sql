-- Contact completes the constrained page registry used by the owner CMS.
insert into public.content_pages (slug, title)
values ('contact', 'Contact')
on conflict (slug) do update set title = excluded.title;
