import "server-only";

import { createPublicClient } from "@/src/supabase/public";
import { isSupabaseConfigured } from "@/src/supabase/config";
import { cmsPageDefaults, getCmsPageDefinition, parseCmsPageContent } from "@/src/cms/site-page-definitions";

export async function getPublishedCmsPage(slug: string): Promise<Record<string, string>> {
  const definition = getCmsPageDefinition(slug);
  if (!definition) throw new Error(`Onbekende CMS-pagina: ${slug}`);
  const fallback = cmsPageDefaults(definition);
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = createPublicClient();
    const { data: page, error: pageError } = await supabase.from("content_pages").select("published_revision_id").eq("slug", slug).maybeSingle();
    if (pageError || !page?.published_revision_id) return fallback;
    const { data: revision, error: revisionError } = await supabase.from("content_revisions").select("content").eq("id", page.published_revision_id).maybeSingle();
    if (revisionError || !revision) return fallback;
    const parsed = parseCmsPageContent(definition, revision.content);
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}
