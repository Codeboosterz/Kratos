import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Dumbbell, Flame, HeartPulse } from "lucide-react";
import { BrandMarquee, CommunityGrid, EditorialReveal, SplitTextHeading } from "@/components/editorial-motion";
import { HomeScrollHero } from "@/components/home-scroll-hero";
import { FaithScrollStory } from "@/components/faith-scroll-story";
import { ProductCard } from "@/components/product-card";
import { getPublishedHomeHero } from "@/src/cms/home";
import { applyCmsProductPresentation, getFeaturedProducts } from "@/src/server/catalogue";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export default async function HomePage() {
  const hero = await getPublishedHomeHero();
  const catalogueContent = await getPublishedCmsPage("trajecten");
  const featured = getFeaturedProducts().map((product) => applyCmsProductPresentation(product, catalogueContent));
  return (
    <>
      <HomeScrollHero
        eyebrow={hero.eyebrow}
        titleLineOne={hero.title_line_1}
        titleLineOneAccent={hero.title_line_1_accent}
        titleLineTwo={hero.title_line_2}
        titleLineTwoAccent={hero.title_line_2_accent}
        intro={hero.intro}
        primaryCtaHref={hero.primary_cta_href}
        primaryCtaLabel={hero.primary_cta_label}
        posterSrc={hero.hero_image_url}
        posterAlt={hero.hero_image_alt}
        motionMode={hero.motion_hero_accents}
      />
      <BrandMarquee primary={hero.marquee_primary} secondary={hero.marquee_secondary} />
      <section className="editorial-light mission-community" aria-labelledby="mission-title">
        <div className="narrow-container editorial-center mission-community__intro">
          <span className="eyebrow">{hero.mission_eyebrow}</span>
          <SplitTextHeading id="mission-title" className="section-title">{hero.mission_title}</SplitTextHeading>
          <p>{hero.mission_text}</p>
        </div>
        <div className="mission-community__stage">
          <div className="mission-community__backdrop" aria-hidden="true" />
          <div className="site-container">
            <CommunityGrid images={hero.community_image_urls} centerImage={hero.mission_image_url} />
          </div>
        </div>
      </section>
      <FaithScrollStory eyebrow={hero.faith_eyebrow} title={hero.faith_title} subtitle={hero.faith_subtitle} intro={hero.faith_text} steps={hero.faith_story_steps} />
      <section className="omar-band" aria-labelledby="omar-title">
        <div className="site-container omar-band__grid">
          <div className="omar-band__portrait"><Image src={hero.omar_image_url} alt="" fill sizes="(max-width: 800px) 90vw, 440px" /></div>
          <EditorialReveal className="omar-band__word"><h2 id="omar-title">{hero.omar_word}</h2></EditorialReveal>
          <EditorialReveal className="omar-band__story"><span className="eyebrow">{hero.omar_eyebrow}</span><h3>{hero.omar_title}</h3><p>{hero.omar_text}</p><Link className="button button--outline" href="/over-omar">Lees het verhaal <ArrowRight size={18} aria-hidden="true" /></Link></EditorialReveal>
        </div>
      </section>
      <section className="section section--editorial reviews-section" aria-labelledby="reviews-title">
        <div className="site-container">
          <EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">{hero.reviews_eyebrow}</span><h2 id="reviews-title" className="section-title">{hero.reviews_title} <span className="lime">{hero.reviews_title_accent}</span></h2><p className="muted">{hero.reviews_intro}</p></EditorialReveal>
          <div className="review-placeholder-row" role="region" aria-label="Cliëntverhalen" tabIndex={0}>{hero.review_cards.map((item) => <article key={item.label}><span>{item.label}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        </div>
      </section>
      <section className="editorial-light trajectory-preview" aria-labelledby="directions-title">
        <div className="site-container">
          <EditorialReveal className="section-heading section-heading--center"><span className="eyebrow">{hero.directions_eyebrow}</span><h2 id="directions-title" className="section-title">{hero.directions_title} <span className="lime">{hero.directions_title_accent}</span></h2></EditorialReveal>
          <div className="direction-grid"><Link href="/trajecten?doel=afvallen"><Flame aria-hidden="true" /><span><strong>Afvallen</strong><small>Bouw aan een vol te houden aanpak.</small></span><ArrowRight aria-hidden="true" /></Link><Link href="/trajecten?doel=spieropbouw"><Dumbbell aria-hidden="true" /><span><strong>Spieropbouw</strong><small>Werk gericht aan kracht en opbouw.</small></span><ArrowRight aria-hidden="true" /></Link><Link href="/trajecten?doel=fit-sterk"><HeartPulse aria-hidden="true" /><span><strong>Fit &amp; sterk</strong><small>Maak bewegen onderdeel van je ritme.</small></span><ArrowRight aria-hidden="true" /></Link></div>
          <div className="lime-cta" data-sticky-final-sentinel><CalendarDays aria-hidden="true" /><div><strong>{hero.final_cta_title}</strong><span>{hero.final_cta_text}</span></div><Link className="button button--dark" href="/intake?source=home-final">Plan een intake <ArrowRight aria-hidden="true" /></Link></div>
        </div>
      </section>
      <section className="section section--tight featured-strip" aria-label="Uitgelichte trajecten"><div className="site-container"><div className="product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div></div></section>
    </>
  );
}
