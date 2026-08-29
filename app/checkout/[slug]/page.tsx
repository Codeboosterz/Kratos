import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { CheckoutClient } from "@/components/checkout-client";
import { getCommerceProduct } from "@/src/server/commerce-catalogue";
import { fixtureMode, trustedSiteOrigin } from "@/src/server/environment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";

export const metadata: Metadata = { title: "Veilig betalen", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getCommerceProduct(slug); if (!product) notFound();
  const [secretKey, publishableKey] = await Promise.all([resolveIntegrationSecret("stripe", "secret_key").catch(() => null), resolveIntegrationSecret("stripe", "publishable_key").catch(() => null)]);
  const liveReady = product.active && Boolean(product.priceCents && product.stripePriceId && secretKey && publishableKey && trustedSiteOrigin);
  const ready = fixtureMode || liveReady;
  return <div className="checkout-page" data-competing-sticky-action><header className="checkout-header"><div className="site-container"><Brand /></div></header><main className="narrow-container checkout-main"><span className="eyebrow-pill">{fixtureMode ? "Veilige demonstratie" : "Checkout"}</span><h1 className="section-title">{product.name}</h1><p className="lead">{product.summary}</p>{fixtureMode ? <div className="fixture-price"><strong>€ 300,00</strong><span>Testbedrag — geen productieprijs</span></div> : product.priceCents ? <div className="fixture-price"><strong>{new Intl.NumberFormat("nl-BE", { style: "currency", currency: product.currency.toUpperCase() }).format(product.priceCents / 100)}</strong></div> : null}{ready ? <CheckoutClient productSlug={product.slug} publishableKey={fixtureMode ? null : publishableKey} fixture={fixtureMode} /> : <div className="status-panel"><strong>Checkout nog niet beschikbaar</strong><p className="muted">Prijs, betaalproduct en productie-URL moeten eerst samen worden bevestigd. Er is niets afgeschreven.</p></div>}<p className="checkout-trust">Een terugkeer-URL is nooit betalingsbewijs. De succespagina controleert altijd een server-owned status.</p></main></div>;
}
