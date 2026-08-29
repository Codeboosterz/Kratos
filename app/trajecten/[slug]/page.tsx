import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Check, ClipboardCheck, Dumbbell, MessageCircle, ShieldCheck, Utensils } from "lucide-react";
import { notFound } from "next/navigation";
import { EditorialReveal, ProcessTimeline } from "@/components/editorial-motion";
import { applyCmsProductPresentation, getProduct, getProducts } from "@/src/server/catalogue";
import { resolveStartAction } from "@/src/server/start-action";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getProducts().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const product = getProduct((await params).slug); return product ? { title: product.name, description: product.summary } : { title: "Traject niet gevonden" }; }

export default async function ProductDetailPage({ params }: Props) {
  const configuredProduct = getProduct((await params).slug); if (!configuredProduct) notFound();
  const content = await getPublishedCmsPage("trajecten");
  const product = applyCmsProductPresentation(configuredProduct, content);
  const startAction = resolveStartAction(product);
  const intakeHref = `/intake?product=${product.slug}&source=product-detail`;
  const benefits = [1, 2, 3, 4, 5, 6].map((number) => ({ title: content[`benefit_${number}_title`], text: content[`benefit_${number}_text`] }));
  const processSteps = [1, 2, 3, 4, 5].map((number) => ({ title: content[`detail_step_${number}_title`], text: content[`detail_step_${number}_text`] }));
  const faqs = [1, 2, 3, 4].map((number) => ({ question: content[`faq_${number}_question`], answer: content[`faq_${number}_answer`] }));
  return (
    <div data-competing-sticky-action>
      <section className="product-editorial-hero" data-sticky-hero-sentinel><div className="site-container product-editorial-hero__grid"><EditorialReveal className="product-editorial-hero__copy"><span className="eyebrow">{product.format}</span><h1 className="display-title">{product.name}</h1><p className="lead">{product.summary}</p><p className="availability">Prijs en definitieve inhoud worden voor de start bevestigd.</p>{startAction.kind === "disabled" ? <Link className="button button--primary" href={intakeHref}>Start met een intake <ArrowRight aria-hidden="true" /></Link> : <Link className="button button--primary" href={startAction.href}>{startAction.label}<ArrowRight aria-hidden="true" /></Link>}</EditorialReveal><div className="product-editorial-hero__image"><Image src={product.image} alt={product.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div></div></section>
      <section className="proof-note"><div className="site-container proof-note__inner"><div className="proof-note__item"><Dumbbell aria-hidden="true" /> Persoonlijk startpunt</div><div className="proof-note__item"><BarChart3 aria-hidden="true" /> Bewuste voortgang</div><div className="proof-note__item"><ShieldCheck aria-hidden="true" /> Heldere afspraken</div></div></section>
      <section className="section section--editorial"><div className="site-container"><EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">{content.detail_benefits_eyebrow}</span><h2 className="section-title">{content.detail_benefits_title} <span className="lime">{content.detail_benefits_accent}</span></h2></EditorialReveal><div className="feature-grid benefit-grid"><article className="feature-card"><Dumbbell aria-hidden="true" /><h2>{benefits[0].title}</h2><p>{benefits[0].text}</p></article><article className="feature-card"><Utensils aria-hidden="true" /><h2>{benefits[1].title}</h2><p>{benefits[1].text}</p></article><article className="feature-card"><CalendarDays aria-hidden="true" /><h2>{benefits[2].title}</h2><p>{benefits[2].text}</p></article><article className="feature-card"><MessageCircle aria-hidden="true" /><h2>{benefits[3].title}</h2><p>{benefits[3].text}</p></article><article className="feature-card"><BarChart3 aria-hidden="true" /><h2>{benefits[4].title}</h2><p>{benefits[4].text}</p></article><article className="feature-card"><ShieldCheck aria-hidden="true" /><h2>{benefits[5].title}</h2><p>{benefits[5].text}</p></article></div></div></section>
      <section className="section section--surface section--editorial"><div className="site-container two-column-editorial"><EditorialReveal><span className="eyebrow">Jouw traject</span><h2 className="section-title">Stap voor <span className="lime">stap.</span></h2><p className="lead">Van intake naar een route die kan meegroeien met jouw context.</p></EditorialReveal><ProcessTimeline items={processSteps} /></div></section>
      <section className="section section--editorial"><div className="site-container coach-feature"><div className="coach-feature__image"><Image src={content.detail_coach_image_url} alt="Omar als coach in de fitnessruimte" fill sizes="(max-width: 800px) 100vw, 48vw" /></div><EditorialReveal><span className="eyebrow">Coach Omar</span><h2 className="section-title">{content.detail_coach_title} <span className="lime">{content.detail_coach_accent}</span></h2><p className="lead">{content.detail_coach_text}</p><Link className="button button--outline" href="/over-omar">Ontmoet Omar</Link></EditorialReveal></div></section>
      <section className="editorial-light section section--editorial"><div className="narrow-container faq"><EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">Veelgestelde vragen</span><h2 className="section-title">Goed om te <span className="lime">weten.</span></h2></EditorialReveal>{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="section section--tight" data-sticky-final-sentinel><div className="site-container product-summary"><div><span className="eyebrow">Samengevat</span><h2 className="section-title">{product.name}</h2><ul><li><Check aria-hidden="true" />Persoonlijk startpunt</li><li><Check aria-hidden="true" />Duidelijke route</li><li><Check aria-hidden="true" />Ruimte voor bijsturing</li></ul></div><div><ClipboardCheck aria-hidden="true" /><h3>Klaar om te starten?</h3><p>Begin met een intake. Daarna bevestigen we inhoud, beschikbaarheid en prijs.</p><Link className="button button--primary" href={intakeHref}>Aanmelden &amp; intake plannen <ArrowRight aria-hidden="true" /></Link></div></div></section>
    </div>
  );
}
