# CMS structure

Provider decision: Supabase Auth + Postgres + Storage is confirmed. `/beheer` is the owner-facing control surface and follows the same carbon, lime and off-white visual language as the public website.

The CMS is designed for a non-technical owner and uses six primary destinations:

1. Overzicht — common tasks and honest system status.
2. Website — pages, sections, navigation, and SEO.
3. Trajecten — product content, visibility, and verified commercial fields.
4. Media — approved images, alt text, focal point, and usage.
5. Aanvragen — intake submissions and follow-up state.
6. Instellingen — owner account, integrations, contact facts, and site settings.

Roles: owner has all capabilities; editor may manage content/media/trajectory drafts if introduced later. Public and CMS data are separated. Drafts never become public through browser-only state.
