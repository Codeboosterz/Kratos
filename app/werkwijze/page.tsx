import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProcessTimeline } from "@/components/editorial-motion";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Werkwijze", description: "Van je eerste aanvraag tot training en evaluatie: zo werkt persoonlijke coaching bij KRATOS Fitness." };
export default async function MethodPage() {
  const content = await getPublishedCmsPage("werkwijze");
  const steps = [1,2,3,4,5].map(index => ({ title: content[`coaching_step_${index}_title`], text: content[`coaching_step_${index}_text`] }));
  return <>
  <section className="page-hero" data-sticky-hero-sentinel><div className="site-container kratos-short-section"><span className="eyebrow-pill">Werkwijze</span><h1 className="display-title">Onze werkwijze.</h1><p className="lead">Van aanvraag tot evaluatie: zo verloopt persoonlijke coaching bij KRATOS.</p><Link className="button button--primary" href="/intake?source=method-hero">Plan een intake <ArrowRight aria-hidden="true" /></Link></div></section>
  <section className="section section--editorial" aria-labelledby="steps-title"><div className="site-container two-column-editorial"><div><span className="eyebrow">Coaching</span><h2 id="steps-title" className="section-title">Vijf stappen.</h2><p>De precieze begeleiding en het contact verschillen per traject. Zelfstandige programma&apos;s hebben hun eigen start en levering.</p></div><ProcessTimeline items={steps} /></div></section>
  <section className="section section--tight editorial-light" data-sticky-final-sentinel><div className="site-container kratos-short-section"><h2 className="section-title">Bespreek jouw start.</h2><Link className="button button--dark" href="/intake?source=method-final">Plan een intake <ArrowRight aria-hidden="true" /></Link></div></section>
</>; }
