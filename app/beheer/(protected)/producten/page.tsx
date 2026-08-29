import { Boxes, CheckCircle2, FileLock2, ShieldAlert } from "lucide-react";
import { ProductOperations } from "@/components/cms/product-operations";
import { requireCmsMembership } from "@/src/cms/auth";
import { getProducts } from "@/src/server/catalogue";
import { saveCmsProduct } from "./actions";

type PageProps = { searchParams: Promise<{ status?: string }> };
type CmsProduct = {
  id: string; slug: string; name: string; description: string; status: "draft" | "active" | "archived";
  price_cents: number | null; currency: string; stripe_product_id: string | null; stripe_price_id: string | null;
  trainerize_plan_id: string | null; digital_asset_id: string | null;
};

function feedback(status?: string) {
  if (status === "saved") return { tone: "success", text: "Productinstellingen opgeslagen." };
  if (status === "owner-required") return { tone: "error", text: "Alleen een eigenaar of super admin kan commerciële instellingen wijzigen." };
  if (status) return { tone: "error", text: "Product kon niet worden opgeslagen. Actieve producten vereisen een prijs en Stripe price ID." };
  return null;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [{ status }, { supabase, membership }] = await Promise.all([searchParams, requireCmsMembership()]);
  const [{ data, error }, { data: assets }] = await Promise.all([
    supabase.from("cms_products").select("id, slug, name, description, status, price_cents, currency, stripe_product_id, stripe_price_id, trainerize_plan_id, digital_asset_id").order("name"),
    supabase.from("digital_assets").select("id, filename, source, status, size_bytes, created_at").is("archived_at", null).order("created_at", { ascending: false }),
  ]);
  const databaseProducts = (data ?? []) as CmsProduct[];
  const products: CmsProduct[] = databaseProducts.length ? databaseProducts : getProducts().map((product) => ({
    id: product.id, slug: product.slug, name: product.name, description: product.summary, status: "draft",
    price_cents: product.priceCents, currency: "eur", stripe_product_id: null, stripe_price_id: product.stripePriceId,
    trainerize_plan_id: product.trainerizePlanId, digital_asset_id: null,
  }));
  const assetMap = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const message = feedback(status);
  const readOnly = membership.role === "editor" || Boolean(error);

  return (
    <main className="cms-main cms-main--wide cms-products-page">
      <div className="cms-page-heading">
        <div><span className="eyebrow">Commerce</span><h1>Producten & privé-PDF’s.</h1><p>Beheer verkoopstatus, Stripe/Trainerize-koppelingen en documenten. Een product gaat pas live na expliciete activering.</p></div>
        <span className={`cms-health-badge ${error ? "is-warning" : "is-healthy"}`}>{error ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{error ? "Migratie nodig" : `${databaseProducts.length} in database`}</span>
      </div>
      {message ? <p className={`cms-message cms-message--${message.tone}`}>{message.text}</p> : null}
      {error ? <div className="cms-operations-alert"><ShieldAlert aria-hidden="true" /><div><strong>Voorvertoning uit de bestaande catalogus</strong><span>Pas de operations-migratie toe voordat wijzigingen kunnen worden opgeslagen of PDF’s gekoppeld.</span></div></div> : null}

      <section className="cms-product-list">
        {products.map((product) => {
          const asset = product.digital_asset_id ? assetMap.get(product.digital_asset_id) : null;
          return (
            <article className="cms-product-row" key={product.id}>
              <header>
                <div className="cms-product-index"><Boxes aria-hidden="true" /></div>
                <div><span>{product.slug}</span><h2>{product.name}</h2></div>
                <span className={`cms-status-pill is-${product.status === "active" ? "connected" : "configuration_required"}`}><i />{product.status === "active" ? "Actief" : product.status === "archived" ? "Gearchiveerd" : "Concept"}</span>
              </header>
              <form action={saveCmsProduct} className="cms-product-form">
                <input type="hidden" name="id" value={product.id} /><input type="hidden" name="slug" value={product.slug} />
                <label className="cms-field--wide"><span>Naam</span><input name="name" defaultValue={product.name} minLength={2} maxLength={120} disabled={readOnly} required /></label>
                <label className="cms-field--wide"><span>Beschrijving</span><textarea name="description" defaultValue={product.description} minLength={10} maxLength={1000} rows={3} disabled={readOnly} required /></label>
                <label><span>Status</span><select name="status" defaultValue={product.status} disabled={readOnly}><option value="draft">Concept</option><option value="active">Actief</option><option value="archived">Gearchiveerd</option></select></label>
                <label><span>Prijs (EUR)</span><input name="price" inputMode="decimal" defaultValue={product.price_cents == null ? "" : (product.price_cents / 100).toFixed(2)} placeholder="149.00" disabled={readOnly} /></label>
                <input type="hidden" name="currency" value={product.currency || "eur"} />
                <label><span>Stripe product ID</span><input name="stripeProductId" defaultValue={product.stripe_product_id ?? ""} placeholder="prod_..." disabled={readOnly} /></label>
                <label><span>Stripe price ID</span><input name="stripePriceId" defaultValue={product.stripe_price_id ?? ""} placeholder="price_..." disabled={readOnly} /></label>
                <label className="cms-field--wide"><span>Trainerize plan ID</span><input name="trainerizePlanId" defaultValue={product.trainerize_plan_id ?? ""} placeholder="Optioneel" disabled={readOnly} /></label>
                <button type="submit" disabled={readOnly}>Product opslaan</button>
              </form>
              <div className="cms-product-delivery">
                <FileLock2 aria-hidden="true" />
                <div><strong>{asset ? asset.filename : "Geen leverings-PDF"}</strong><span>{asset ? `${asset.source === "ai_generated" ? "AI-concept" : "Upload"} · ${asset.status} · ${(asset.size_bytes / 1024 / 1024).toFixed(2)} MB` : "Upload of genereer een privé-document."}</span></div>
              </div>
              <ProductOperations productId={product.id} disabled={readOnly} />
            </article>
          );
        })}
      </section>
    </main>
  );
}
