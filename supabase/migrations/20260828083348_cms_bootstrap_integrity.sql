-- Cover the revision pointer used by the foreign key and publish workflow.
create index if not exists content_pages_published_revision_idx
  on public.content_pages (published_revision_id);

-- Ensure the seeded homepage revision is reachable through the public page pointer.
update public.content_pages as page
set published_revision_id = revision.id,
    updated_at = now()
from public.content_revisions as revision
where page.id = revision.page_id
  and page.slug = 'home'
  and revision.status = 'published'
  and page.published_revision_id is null;
