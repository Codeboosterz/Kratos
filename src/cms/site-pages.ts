import "server-only";

import { createPublicClient } from "@/src/supabase/public";
import { isSupabaseConfigured } from "@/src/supabase/config";
import { cmsPageDefaults, getCmsPageDefinition, parseStoredCmsPageContent } from "@/src/cms/site-page-definitions";

const previousCommunityCopy: Record<string, string> = {
  "community_hero_cta": "Ik heb interesse",
  "community_hero_note": "Vertel ons dat je wilt meedoen. Kratos neemt persoonlijk contact met je op.",
  "community_values_title": "Samen groeien.",
  "community_values_accent": "Op jouw tempo.",
  "community_final_title": "Je hoeft het niet",
  "community_final_accent": "alleen te doen.",
  "community_final_text": "Wil je meer weten over Faith & Fitness? Geef je interesse door via de intake en vermeld dat je voor de community komt.",
  "community_final_note": "Een interesseaanvraag is geen lidmaatschap, boeking of betaling. Praktische afspraken bespreken we persoonlijk.",
  "community_hero_title": "Faith &",
  "community_hero_accent": "Fitness.",
  "community_hero_intro": "Sterk in lichaam. Geworteld in geloof. Een plek om samen te bewegen, elkaar aan te moedigen en bewust te groeien."
};

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
    const parsed = parseStoredCmsPageContent(definition, revision.content);
    if (!parsed.success) return fallback;
    if (slug === "gratis-tools") {
      for (const [key, previous] of Object.entries(previousCommunityCopy)) {
        if (parsed.data[key] === previous) parsed.data[key] = fallback[key];
      }
    }
    return parsed.data;
  } catch {
    return fallback;
  }
}
