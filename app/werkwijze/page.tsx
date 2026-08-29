import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, MessageCircle, SlidersHorizontal } from "lucide-react";
import { EditorialReveal, ProcessTimeline } from "@/components/editorial-motion";
import { AnimatedMethodHeading } from "@/components/scroll-story";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Werkwijze", description: "Ontdek hoe persoonlijke coaching bij Kratos wordt opgebouwd." };

export default async function MethodPage() {
  const content = await getPublishedCmsPage("werkwijze");
  const steps = [1,2,3,4].map((index) => ({ title: content[`step_${index}_title`], text: content[`step_${index}_text`] }));
  return (
    <>
      <section className="page-hero page-hero--split" data-sticky-hero-sentinel>
        <div className="site-container split-panel">
          <EditorialReveal className="split-panel__content"><span className="eyebrow-pill">{content.hero_eyebrow}</span><h1 className="display-title">{content.hero_title}<br /><span className="lime">{content.hero_accent}</span></h1><p className="lead">{content.hero_intro}</p><Link className="button button--primary" href="/intake?source=method-hero">Plan een intake <ArrowRight aria-hidden="true" /></Link></EditorialReveal>
          <div className="split-panel__image"><Image src={content.hero_image_url} alt={content.hero_image_alt} fill priority sizes="(max-width: 800px) 100vw, 52vw" /></div>
        </div>
      </section>
      <section className="section section--editorial"><div className="site-container two-column-editorial"><div><span className="eyebrow">{content.steps_eyebrow}</span><AnimatedMethodHeading firstLineMode="typewriter" secondLineMode="slide_up" firstLine={content.steps_line_1} secondLine={content.steps_line_2} /></div><ProcessTimeline items={steps} /></div></section>
      <section className="editorial-light section section--editorial"><div className="site-container"><EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">{content.basis_eyebrow}</span><h2 className="section-title">{content.basis_title} <span className="lime">{content.basis_accent}</span></h2></EditorialReveal><div className="feature-grid editorial-features">{[ClipboardCheck,MessageCircle,BarChart3,SlidersHorizontal].map((Icon,index) => <article className="feature-card" key={index}><Icon aria-hidden="true" /><h2>{content[`feature_${index+1}_title`]}</h2><p>{content[`feature_${index+1}_text`]}</p></article>)}</div></div></section>
      <section className="section section--tight" data-sticky-final-sentinel><div className="site-container final-cta"><span className="eyebrow">{content.final_eyebrow}</span><h2 className="section-title">{content.final_title} <span className="lime">{content.final_accent}</span></h2><Link className="button button--primary" href="/intake?source=method-final">Plan een intake <ArrowRight aria-hidden="true" /></Link></div></section>
    </>
  );
}
