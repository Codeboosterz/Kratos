-- Register the approved public route set so each page has a stable CMS identity.
-- Content remains revisioned through the existing save/publish RPCs.
insert into public.content_pages (slug, title)
values
  ('resultaten', 'Resultaten'),
  ('werkwijze', 'Werkwijze'),
  ('trajecten', 'Trajecten'),
  ('over-omar', 'Over Omar'),
  ('gratis-tools', 'Gratis tools'),
  ('intake', 'Intake')
on conflict (slug) do update set title = excluded.title;
