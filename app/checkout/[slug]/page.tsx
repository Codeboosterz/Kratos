import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutClient } from "@/components/checkout-client";
import { getCommerceProduct } from "@/src/server/commerce-catalogue";
import { fixtureMode } from "@/src/server/environment";
import { getCheckoutConfiguration } from "@/src/server/checkout-configuration";

export const metadata: Metadata = { title: "Veilig betalen", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCommerceProduct(slug);
  if (!product) notFound();
  const configuration = fixtureMode ? { ready: false as const } : await getCheckoutConfiguration(product);
  const ready = fixtureMode || configuration.ready;
  return (
    <div className="checkout-page" data-competing-sticky-action>
      <section className="narrow-container checkout-main" aria-labelledby="checkout-title">
        <span className="eyebrow-pill">{fixtureMode ? "Veilige demonstratie" : "Checkout"}</span>
        <h1 className="section-title" id="checkout-title">{product.name}</h1>
        <p className="lead">{product.summary}</p>
        {fixtureMode ? (
          <div className="fixture-price"><strong>€ 300,00</strong><span>Testbedrag — geen productieprijs</span></div>
        ) : product.priceCents ? (
          <div className="fixture-price"><strong>{new Intl.NumberFormat("nl-BE", { style: "currency", currency: product.currency.toUpperCase() }).format(product.priceCents / 100)}</strong><span>Eenmalige betaling</span></div>
        ) : null}
        {ready ? (
          <CheckoutClient key={product.slug} productSlug={product.slug}
            publishableKey={configuration.ready ? configuration.publishableKey : null}
            quote={configuration.ready ? { priceCents: configuration.product.priceCents, currency: configuration.product.currency } : null}
            fixture={fixtureMode} />
        ) : (
          <div className="status-panel"><strong>Checkout nog niet beschikbaar</strong><p className="muted">Online betalen voor dit traject is nog niet geactiveerd. Er is geen betaling gestart en niets afgeschreven.</p></div>
        )}
        <p className="checkout-trust">Je betaalt veilig via Stripe. Je betaalstatus wordt gecontroleerd voordat we een bevestiging tonen.</p>
        <Link className="button button--outline" href={`/trajecten/${product.slug}`}>Terug naar het traject</Link>
      </section>
    </div>
  );
}
