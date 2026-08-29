import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, BarChart3, ClipboardCheck, MessageCircle, Moon, SlidersHorizontal, TrendingUp, Zap } from "lucide-react";
import { ClientStoriesRail, ScrollAccent } from "@/components/scroll-story";
import { EditorialReveal } from "@/components/editorial-motion";
import { getPublishedHomeHero } from "@/src/cms/home";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = {
  title: "Resultaten",
  description: "Hoe Kratos Fitness een eerlijk startpunt bepaalt, voortgang bespreekt en gericht bijstuurt.",
};

const progressPoints = [18, 25, 36, 49, 44, 53, 56, 70, 76, 84, 91, 100];

export default async function ResultsPage() {
  const motionSettings = await getPublishedHomeHero();
  const content = await getPublishedCmsPage("resultaten");
  const animateAccents = motionSettings.motion_results_accents === "slide";
  const stories = [1, 2, 3, 4].map((number) => ({ label: content[`story_${number}_label`], title: content[`story_${number}_title`], text: content[`story_${number}_text`], image: content[`story_${number}_image_url`] }));

  return (
    <>
      <section className="results-hero" data-sticky-hero-sentinel>
        <div className="site-container results-hero__grid">
          <div className="results-hero__copy">
            <span className="eyebrow">{content.hero_eyebrow}</span>
            <h1 className="display-title">{content.hero_title} <ScrollAccent enabled={animateAccents}>{content.hero_accent}</ScrollAccent></h1>
            <ul className="hero-checks"><li>{content.hero_check_1}</li><li>{content.hero_check_2}</li><li>{content.hero_check_3}</li></ul>
            <Link className="button button--primary" href="/intake?source=results-hero">Plan jouw intakegesprek <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="results-hero__image"><Image src={content.hero_image_url} alt={content.hero_image_alt} fill priority loading="eager" sizes="(max-width: 900px) 100vw, 52vw" /></div>
        </div>
      </section>

      <section className="section section--editorial results-method" aria-labelledby="results-method-title">
        <div className="site-container">
          <EditorialReveal className="section-heading"><span className="eyebrow">{content.method_eyebrow}</span><h2 id="results-method-title" className="section-title">{content.method_title} <ScrollAccent enabled={animateAccents} direction="right">{content.method_accent}</ScrollAccent></h2></EditorialReveal>
          <div className="results-step-grid">
            <article><span>01</span><ClipboardCheck aria-hidden="true" /><h3>{content.step_1_title}</h3><p>{content.step_1_text}</p></article>
            <article><span>02</span><MessageCircle aria-hidden="true" /><h3>{content.step_2_title}</h3><p>{content.step_2_text}</p></article>
            <article><span>03</span><SlidersHorizontal aria-hidden="true" /><h3>{content.step_3_title}</h3><p>{content.step_3_text}</p></article>
          </div>
          <div className="progress-board" aria-label="Illustratieve weergave van voortgang">
            <div className="progress-board__legend"><span className="eyebrow">Voorbeeldweergave</span><h3>Voortgang in één oogopslag</h3><ul><li><TrendingUp aria-hidden="true" /> Kracht</li><li><Activity aria-hidden="true" /> Consistentie</li><li><Zap aria-hidden="true" /> Energie</li><li><Moon aria-hidden="true" /> Herstel</li></ul></div>
            <div className="progress-chart"><div className="progress-chart__grid" />{progressPoints.map((point, index) => <i key={index} style={{ left: `${(index / (progressPoints.length - 1)) * 100}%`, bottom: `${point}%` }} />)}<svg viewBox="0 0 1100 120" preserveAspectRatio="none" aria-hidden="true"><polyline points={progressPoints.map((point, index) => `${index * 100},${120 - point}`).join(" ")} /></svg><div className="progress-chart__weeks">{progressPoints.map((_, index) => <span key={index}>W{index + 1}</span>)}</div></div>
          </div>
        </div>
      </section>

      <section className="section section--surface section--editorial">
        <div className="site-container results-context">
          <EditorialReveal><span className="eyebrow">{content.context_eyebrow}</span><h2 className="section-title">{content.context_title} <ScrollAccent enabled={animateAccents}>{content.context_accent}</ScrollAccent></h2><div className="results-principles">{[1,2,3].map((index) => <article key={index}><strong>{content[`principle_${index}_title`]}</strong><p>{content[`principle_${index}_text`]}</p></article>)}</div></EditorialReveal>
          <div className="results-context__image"><Image src={content.context_image_url} alt={content.context_image_alt} fill sizes="(max-width: 900px) 100vw, 48vw" /></div>
        </div>
      </section>

      <section className="section section--editorial" aria-labelledby="client-stories-title">
        <div className="site-container"><div className="section-heading section-heading--center"><span className="eyebrow">{content.stories_eyebrow}</span><h2 id="client-stories-title" className="section-title">{content.stories_title} <ScrollAccent enabled={animateAccents}>{content.stories_accent}</ScrollAccent></h2><p className="muted">{content.stories_intro}</p></div><ClientStoriesRail motionMode={motionSettings.motion_client_stories} stories={stories} /></div>
      </section>

      <section className="section section--tight" data-sticky-final-sentinel><div className="site-container final-cta"><BarChart3 aria-hidden="true" /><span className="eyebrow">Jouw startpunt</span><h2 className="section-title">{content.final_title} <ScrollAccent enabled={animateAccents} direction="right">{content.final_accent}</ScrollAccent></h2><p>{content.final_text}</p><Link className="button button--primary" href="/intake?source=results">Plan een intake <ArrowRight aria-hidden="true" size={20} /></Link></div></section>
    </>
  );
}
