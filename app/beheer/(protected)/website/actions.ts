"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCmsMembership } from "@/src/cms/auth";
import { homeHeroFromFormData } from "@/src/cms/home";
import { getCmsPageDefinition, parseCmsPageContent } from "@/src/cms/site-page-definitions";

export type CmsActionState = {
  status?: "success" | "error";
  message?: string;
  revisionId?: string;
  version?: number;
  fieldErrors?: Record<string, string[]>;
};

function compactFieldErrors(errors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
  );
}

export async function saveHomeRevision(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const { supabase } = await requireCmsMembership();
  const parsed = homeHeroFromFormData(formData);
  if (!parsed.success) {
    return { status: "error", message: "Controleer de gemarkeerde velden.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const summary = z.string().trim().max(240).catch("").parse(formData.get("change_summary"));
  const { data, error } = await supabase.rpc("cms_save_content_revision", {
    target_slug: "home",
    revision_content: parsed.data,
    revision_summary: summary || null,
  });

  const saved = data?.[0];
  if (error || !saved) return { status: "error", message: "Opslaan is niet gelukt. Probeer het opnieuw." };

  revalidatePath("/beheer");
  revalidatePath("/beheer/website");
  return { status: "success", message: `Conceptversie ${saved.revision_version} is veilig opgeslagen.`, revisionId: saved.revision_id, version: saved.revision_version };
}

export async function publishHomeRevision(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const { supabase } = await requireCmsMembership();
  const revisionId = z.uuid().safeParse(formData.get("revision_id"));
  if (!revisionId.success) return { status: "error", message: "Sla eerst een geldig concept op." };

  const { data, error } = await supabase.rpc("cms_publish_content_revision", { target_revision_id: revisionId.data });
  const published = data?.[0];
  if (error || !published) {
    return { status: "error", message: error?.message.includes("Only an active CMS owner") ? "Alleen een eigenaar kan publiceren." : "Publiceren is niet gelukt. Vernieuw de pagina en probeer opnieuw." };
  }

  revalidatePath("/");
  revalidatePath("/beheer");
  revalidatePath("/beheer/website");
  return { status: "success", message: `Versie ${published.published_version} staat nu live.`, revisionId: published.published_revision_id, version: published.published_version };
}

export async function saveStructuredPageRevision(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const { supabase } = await requireCmsMembership();
  const slugValue = z.string().trim().max(80).safeParse(formData.get("page_slug"));
  const definition = slugValue.success ? getCmsPageDefinition(slugValue.data) : null;
  if (!definition) return { status: "error", message: "Onbekende of ongeldige websitepagina." };

  const rawContent = Object.fromEntries(definition.fields.map((item) => [item.key, formData.get(item.key)]));
  const parsed = parseCmsPageContent(definition, rawContent);
  if (!parsed.success) return { status: "error", message: "Controleer de gemarkeerde velden.", fieldErrors: compactFieldErrors(parsed.error.flatten().fieldErrors) };

  const summary = z.string().trim().max(240).catch("").parse(formData.get("change_summary"));
  const { data, error } = await supabase.rpc("cms_save_content_revision", { target_slug: definition.slug, revision_content: parsed.data, revision_summary: summary || null });
  const saved = data?.[0];
  if (error || !saved) return { status: "error", message: "Opslaan is niet gelukt. Controleer of deze pagina in Supabase geregistreerd is." };
  revalidatePath("/beheer"); revalidatePath(`/beheer/website`);
  return { status: "success", message: `Conceptversie ${saved.revision_version} is veilig opgeslagen.`, revisionId: saved.revision_id, version: saved.revision_version };
}

export async function publishStructuredPageRevision(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const { supabase } = await requireCmsMembership();
  const slugValue = z.string().trim().max(80).safeParse(formData.get("page_slug"));
  const definition = slugValue.success ? getCmsPageDefinition(slugValue.data) : null;
  const revisionId = z.uuid().safeParse(formData.get("revision_id"));
  if (!definition || !revisionId.success) return { status: "error", message: "Sla eerst een geldig concept op." };

  const { data: revision } = await supabase.from("content_revisions").select("page_id").eq("id", revisionId.data).eq("status", "draft").maybeSingle();
  const { data: page } = revision ? await supabase.from("content_pages").select("slug").eq("id", revision.page_id).maybeSingle() : { data: null };
  if (page?.slug !== definition.slug) return { status: "error", message: "Dit concept hoort niet bij de geselecteerde pagina." };

  const { data, error } = await supabase.rpc("cms_publish_content_revision", { target_revision_id: revisionId.data });
  const published = data?.[0];
  if (error || !published) return { status: "error", message: error?.message.includes("Only an active CMS owner") ? "Alleen een eigenaar kan publiceren." : "Publiceren is niet gelukt." };
  revalidatePath(definition.route); revalidatePath("/beheer"); revalidatePath("/beheer/website");
  return { status: "success", message: `Versie ${published.published_version} staat nu live.`, revisionId: published.published_revision_id, version: published.published_version };
}
