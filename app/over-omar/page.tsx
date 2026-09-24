import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Over Omar", description: "Maak kennis met Omar, coach achter KRATOS Fitness." };

export default async function AboutPage() {
  const content = await getPublishedCmsPage("over-omar");
  return <>
    <section className="about-hero" data-sticky-hero-sentinel><div className="site-container about-hero__grid"><div className="about-hero__copy"><span className="eyebrow">Over Omar</span><h1 className="display-title">Maak kennis met <span className="lime">Omar.</span></h1><p className="lead">Ik ben Omar, de coach achter KRATOS Fitness.</p><Link className="button button--primary" href="/intake?source=about-hero">Plan een kennismaking <ArrowRight aria-hidden="true" /></Link></div><div className="about-hero__image"><Image src={content.hero_image_url} alt={content.hero_image_alt} fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div></div></section>
    <section className="section section--editorial"><div className="site-container kratos-short-section"><span className="eyebrow">KRATOS Fitness</span><h2 className="section-title">Persoonlijke coaching.</h2><p>Bij KRATOS kun je met Omar persoonlijk trainen, samen trainen in Duo Coaching of begeleiding op afstand aanvragen. In de intake bespreek je jouw doel en welke vorm past.</p><Link className="button button--outline" href="/werkwijze">Bekijk onze werkwijze <ArrowRight aria-hidden="true" /></Link></div></section>
    <section className="section section--tight editorial-light" data-sticky-final-sentinel><div className="site-container lime-cta"><div><strong>Vertel Omar over jouw doel.</strong><span>Stel je vraag of plan een kennismaking.</span></div><Link className="button button--dark" href="/intake?source=about-final">Plan een kennismaking <ArrowRight aria-hidden="true" /></Link></div></section>
  </>;
}
