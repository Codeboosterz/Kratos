import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { applyCmsProductPresentation, getProduct, getProducts } from "@/src/server/catalogue";
import { resolveStartAction } from "@/src/server/start-action";
import { getPublishedCmsPage } from "@/src/cms/site-pages";
import { mediaApproved, priceLabel, productDetails } from "@/src/content/product-details";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export function generateStaticParams() { return getProducts().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const product = getProduct((await params).slug); return product ? { title: product.name, description: product.summary } : { title: "Traject niet gevonden" }; }

export default async function ProductDetailPage({ params }: Props) {
  const configuredProduct = getProduct((await params).slug); if (!configuredProduct) notFound();
  const content = await getPublishedCmsPage("trajecten");
  const product = applyCmsProductPresentation(configuredProduct, content);
  const key = product.slug.replaceAll("-", "_");
  const defaults = productDetails[product.slug];
  const detail = {
    audience: content[`product_${key}_audience`] || defaults.audience,
    delivery: content[`product_${key}_delivery`] || defaults.delivery,
    included: content[`product_${key}_included`]?.split("\n").map(item => item.trim()).filter(Boolean) || defaults.included,
    practical: content[`product_${key}_practical`] || defaults.practical,
  };
  const action = await resolveStartAction(product);
  const independent = product.category === "digital_program" || product.category === "home_workout";
  return <div data-competing-sticky-action>
    <section className="product-editorial-hero" data-sticky-hero-sentinel><div className="site-container product-editorial-hero__grid">
      <div className="product-editorial-hero__copy"><span className="eyebrow">{product.format}</span><h1 className="display-title">{product.name}</h1><p className="lead">{product.summary}</p><p className="availability">{priceLabel(product)}</p><Link className="button button--outline" href="#traject-inhoud">Bekijk de inhoud <ArrowRight aria-hidden="true" /></Link></div>
      {mediaApproved(product) ? <div className="product-editorial-hero__image"><Image src={product.image} alt={product.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div> : <div className="product-editorial-hero__image product-editorial-hero__image--empty" aria-hidden="true"><span>KRATOS</span></div>}
    </div></section>
    <section id="traject-inhoud" className="section section--editorial"><div className="site-container"><span className="eyebrow">{independent ? "Zelfstandig trainen" : "Begeleid traject"}</span><h2 className="section-title">Dit moet je weten.</h2><div className="product-facts">
      <article><h3>Voor wie</h3><p>{detail.audience}</p></article><article><h3>Wat inbegrepen is</h3><ul>{detail.included.map(item => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></article><article><h3>Hoe het werkt</h3><p>{detail.delivery}</p></article><article><h3>Praktische gegevens</h3><p>{detail.practical}</p></article>
    </div><p className="muted">{independent ? "Dit programma volg je zelfstandig; persoonlijke coaching is geen standaardonderdeel." : "Bekijk hoe coaching van aanvraag tot evaluatie verloopt op de pagina Onze werkwijze."}</p>{!independent ? <Link className="button button--outline" href="/werkwijze">Bekijk onze werkwijze</Link> : null}</div></section>
    <section className="section section--tight" data-sticky-final-sentinel><div className="site-container final-cta"><span className="eyebrow">Starten</span><h2 className="section-title">{product.name}</h2><p>Vraag naar de inhoud, praktische afspraken en prijs voordat je start.</p><Link className="button button--primary" data-testid="start-product" href={action.href}>{action.label} <ArrowRight aria-hidden="true" /></Link></div></section>
  </div>;
}
