import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, CircleGauge, Dumbbell, HeartPulse, Info, ShieldCheck, Target } from "lucide-react";
import { EditorialReveal } from "@/components/editorial-motion";
import { FreeToolsCalculator } from "@/components/free-tools-calculator";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Gratis tools", description: "Toegankelijke gezondheidstools van Kratos Fitness, met duidelijke context en beperkingen." };

export default async function ToolsPage() {
  const content = await getPublishedCmsPage("gratis-tools");
  const limits = [1, 2, 3].map((number) => ({ title: content[`limit_${number}_title`], text: content[`limit_${number}_text`] }));
  return (
    <>
      <section className="tools-hero" data-sticky-hero-sentinel><div className="site-container tools-hero__grid"><div className="tools-hero__copy"><span className="eyebrow">{content.hero_eyebrow}</span><h1 className="display-title">{content.hero_title} <span className="lime">{content.hero_accent}</span></h1><p className="lead">{content.hero_intro}</p><ul className="hero-checks"><li>{content.hero_check_1}</li><li>{content.hero_check_2}</li><li>{content.hero_check_3}</li></ul></div><div className="tools-hero__image"><div className="tools-orbit" aria-hidden="true" /><Image src={content.hero_image_url} alt={content.hero_image_alt} fill priority sizes="(max-width: 900px) 100vw, 48vw" /></div></div></section>

      <section className="section section--editorial"><div className="site-container"><FreeToolsCalculator /></div></section>

      <section className="section section--surface section--editorial"><div className="site-container limitations-panel"><EditorialReveal><span className="eyebrow">Belangrijk</span><h2 className="section-title">{content.limits_title} <span className="lime">{content.limits_accent}</span></h2></EditorialReveal><div className="limitations-list"><article><ShieldCheck aria-hidden="true" /><div><h3>{limits[0].title}</h3><p>{limits[0].text}</p></div></article><article><Info aria-hidden="true" /><div><h3>{limits[1].title}</h3><p>{limits[1].text}</p></div></article><article><HeartPulse aria-hidden="true" /><div><h3>{limits[2].title}</h3><p>{limits[2].text}</p></div></article></div></div></section>

      <section className="section section--editorial"><div className="site-container"><EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">Volg je traject</span><h2 className="section-title">Van inzicht naar <span className="lime">actie.</span></h2></EditorialReveal><div className="tools-path"><Link href="/werkwijze"><Target aria-hidden="true" /><span><strong>Startpunt bepalen</strong><small>Zet informatie om in een persoonlijke richting.</small></span><ArrowRight aria-hidden="true" /></Link><Link href="/trajecten"><Dumbbell aria-hidden="true" /><span><strong>Plan op maat</strong><small>Bekijk vormen die passen bij jouw doel en week.</small></span><ArrowRight aria-hidden="true" /></Link><Link href="/resultaten"><Activity aria-hidden="true" /><span><strong>Resultaten volgen</strong><small>Leer hoe Kratos voortgang bespreekt.</small></span><ArrowRight aria-hidden="true" /></Link></div></div></section>

      <section className="section section--tight" data-sticky-final-sentinel><div className="site-container final-cta"><CircleGauge aria-hidden="true" /><span className="eyebrow">Volgende stap</span><h2 className="section-title">{content.final_title} <span className="lime">{content.final_accent}</span></h2><p>{content.final_text}</p><Link className="button button--primary" href="/intake?source=tools">Plan een intake <ArrowRight aria-hidden="true" size={20} /></Link></div></section>
    </>
  );
}
