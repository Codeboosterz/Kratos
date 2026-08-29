import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ear, Route, ShieldCheck, Target } from "lucide-react";
import { EditorialReveal, ProcessTimeline } from "@/components/editorial-motion";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Over Omar", description: "Maak kennis met Omar en de coachingsaanpak van Kratos Fitness." };

export default async function AboutPage() {
  const content = await getPublishedCmsPage("over-omar");
  const values = [1, 2, 3].map((number) => ({ title: content[`value_${number}_title`], text: content[`value_${number}_text`] }));
  const steps = [1, 2, 3, 4].map((number) => ({ title: content[`step_${number}_title`], text: content[`step_${number}_text`] }));
  return (
    <>
      <section className="about-hero" data-sticky-hero-sentinel><div className="site-container about-hero__grid"><EditorialReveal className="about-hero__copy"><span className="eyebrow">{content.hero_eyebrow}</span><h1 className="display-title">{content.hero_title}<br /><span className="lime">{content.hero_accent}</span></h1><p className="lead">{content.hero_intro}</p><Link className="button button--primary" href="/intake?source=about-hero">Plan jouw intake <ArrowRight aria-hidden="true" /></Link></EditorialReveal><div className="about-hero__image"><Image src={content.hero_image_url} alt={content.hero_image_alt} fill priority loading="eager" sizes="(max-width: 800px) 100vw, 55vw" /></div></div></section>
      <section className="section section--tight"><div className="site-container feature-grid"><article className="feature-card"><Ear aria-hidden="true" /><h2>{values[0].title}</h2><p>{values[0].text}</p></article><article className="feature-card"><Route aria-hidden="true" /><h2>{values[1].title}</h2><p>{values[1].text}</p></article><article className="feature-card"><ShieldCheck aria-hidden="true" /><h2>{values[2].title}</h2><p>{values[2].text}</p></article></div></section>
      <section className="section section--editorial section--surface"><div className="site-container coach-feature"><EditorialReveal><span className="eyebrow">{content.coach_eyebrow}</span><h2 className="section-title">{content.coach_title} <span className="lime">{content.coach_accent}</span></h2><p className="lead">{content.coach_text}</p></EditorialReveal><div className="coach-feature__image"><Image src={content.coach_image_url} alt={content.hero_image_alt} fill sizes="(max-width: 800px) 100vw, 52vw" /></div></div></section>
      <section className="section section--editorial"><div className="site-container two-column-editorial"><EditorialReveal><span className="eyebrow">Zo gaan we te werk</span><h2 className="section-title">Eerst begrijpen.<br /><span className="lime">Dan pas bouwen.</span></h2></EditorialReveal><ProcessTimeline items={steps} /></div></section>
      <section className="editorial-light section section--editorial"><div className="site-container beliefs"><EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">Waar Kratos voor staat</span><h2 className="section-title">Waar ik in <span className="lime">geloof.</span></h2></EditorialReveal><div className="direction-grid"><article><Target aria-hidden="true" /><span><strong>Doelgericht</strong><small>Elke stap heeft een reden.</small></span></article><article><Ear aria-hidden="true" /><span><strong>Persoonlijk</strong><small>Jij bent geen nummer.</small></span></article><article><ShieldCheck aria-hidden="true" /><span><strong>Duurzaam</strong><small>Een aanpak die mee kan bewegen.</small></span></article></div></div></section>
      <section className="section section--tight" data-sticky-final-sentinel><div className="site-container lime-cta"><Target aria-hidden="true" /><div><strong>{content.final_title}</strong><span>{content.final_text}</span></div><Link className="button button--dark" href="/intake?source=about-final">Plan jouw intake <ArrowRight aria-hidden="true" /></Link></div></section>
    </>
  );
}
