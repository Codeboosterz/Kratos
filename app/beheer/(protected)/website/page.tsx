import { HomeEditor } from "@/components/cms/home-editor";
import Link from "next/link";
import { StructuredPageEditor } from "@/components/cms/structured-page-editor";
import { defaultHomeHero, homeHeroSchema } from "@/src/cms/home";
import { requireCmsMembership } from "@/src/cms/auth";
import { cmsPageDefaults, cmsPageDefinitions, getCmsPageDefinition, parseCmsPageContent } from "@/src/cms/site-page-definitions";

type Props = { searchParams: Promise<{ pagina?: string | string[] }> };

export default async function WebsiteEditorPage({ searchParams }: Props) {
  const query = await searchParams;
  const requestedPage = Array.isArray(query.pagina) ? query.pagina[0] : query.pagina;
  const selectedDefinition = getCmsPageDefinition(requestedPage);
  const selectedSlug = selectedDefinition?.slug || "home";
  const { supabase, membership } = await requireCmsMembership();
  const { data: page } = await supabase.from("content_pages").select("id, published_revision_id").eq("slug", selectedSlug).maybeSingle();
  const { data: revisions } = page ? await supabase
    .from("content_revisions")
    .select("id, version, status, content, created_at")
    .eq("page_id", page.id)
    .order("version", { ascending: false })
    .limit(30) : { data: [] };
  const { data: media } = await supabase.from("media_assets").select("public_url, filename, alt_text").is("archived_at", null).order("created_at", { ascending: false });

  const draft = revisions?.find((revision) => revision.status === "draft") || null;
  const published = revisions?.find((revision) => revision.id === page?.published_revision_id) || null;
  const source = draft || published;
  const parsedHome = homeHeroSchema.safeParse(source?.content);
  const parsedStructured = selectedDefinition ? parseCmsPageContent(selectedDefinition, source?.content) : null;
  const initialStructured = selectedDefinition && parsedStructured?.success ? parsedStructured.data : selectedDefinition ? cmsPageDefaults(selectedDefinition) : null;

  return (
    <main className="cms-main cms-main--wide">
      <div className="cms-page-heading">
        <div><span className="eyebrow">Website</span><h1>{selectedDefinition ? `${selectedDefinition.title} bewerken` : "Homepage bewerken"}</h1><p>{selectedDefinition?.description || "Wijzig de inhoud in veilige velden en controleer meteen het resultaat."}</p></div>
      </div>
      <nav className="cms-page-tabs" aria-label="Kies een websitepagina"><Link className={!selectedDefinition ? "is-active" : ""} href="/beheer/website">Homepage</Link>{cmsPageDefinitions.map((definition) => <Link className={definition.slug === selectedDefinition?.slug ? "is-active" : ""} href={`/beheer/website?pagina=${definition.slug}`} key={definition.slug}>{definition.title}</Link>)}</nav>
      {!selectedDefinition ? <HomeEditor
        initialContent={parsedHome.success ? parsedHome.data : defaultHomeHero}
        draftRevisionId={draft?.id || null}
        draftVersion={draft?.version || null}
        publishedVersion={published?.version || null}
        canPublish={membership.role === "owner" || membership.role === "super_admin"}
        media={media || []}
      /> : initialStructured ? <StructuredPageEditor definition={selectedDefinition} initialContent={initialStructured} draftRevisionId={draft?.id || null} draftVersion={draft?.version || null} publishedVersion={published?.version || null} canPublish={membership.role === "owner" || membership.role === "super_admin"} media={media || []} isRegistered={Boolean(page)} /> : null}
      <section className="cms-panel cms-history-panel">
        <div className="cms-panel__heading"><div><span className="eyebrow">Versiegeschiedenis</span><h2>Laatste versies</h2></div></div>
        <div className="cms-history-list">
          {revisions?.map((revision) => <div key={revision.id}><strong>Versie {revision.version}</strong><span className={`cms-status cms-status--${revision.status}`}>{revision.status === "published" ? "Live" : revision.status === "draft" ? "Concept" : "Archief"}</span><time dateTime={revision.created_at}>{new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.created_at))}</time></div>)}
        </div>
      </section>
    </main>
  );
}
