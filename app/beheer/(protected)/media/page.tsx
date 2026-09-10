import { MediaLibrary } from "@/components/cms/media-library";
import { requireCmsMembership } from "@/src/cms/auth";

export default async function MediaPage() {
  const { supabase, userId } = await requireCmsMembership();
  const { data: assets, error } = await supabase
    .from("media_assets")
    .select("id, public_url, filename, alt_text, size_bytes, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="cms-main">
      <div className="cms-page-heading"><div><span className="eyebrow">Media</span><h1>Mediabibliotheek</h1><p>Upload afbeeldingen en gebruik ze direct in de website-editor.</p></div></div>
      {error ? <div className="form-status error" role="alert">De mediabibliotheek kon niet worden geladen. Vernieuw de pagina om het opnieuw te proberen. Er zijn geen bestanden verwijderd.</div>
        : <MediaLibrary assets={assets || []} userId={userId} />}
    </div>
  );
}
