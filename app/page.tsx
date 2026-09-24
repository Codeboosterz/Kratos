import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeScrollHero } from "@/components/home-scroll-hero";
import { getPublishedHomeHero } from "@/src/cms/home";

const directions = [
  { title: "Personal training", text: "Train persoonlijk met Omar.", href: "/trajecten?categorie=personal_training" },
  { title: "Duo Coaching", text: "Train samen met je trainingspartner.", href: "/trajecten/duo-coaching" },
  { title: "Online Coaching", text: "Ontvang begeleiding op afstand.", href: "/trajecten/premium-online-coaching" },
  { title: "Zelfstandig trainen", text: "Bekijk schema's en thuisprogramma's.", href: "/trajecten?categorie=digital_program" },
];

export default async function HomePage() {
  const hero = await getPublishedHomeHero();
  return <>
    <HomeScrollHero eyebrow={hero.eyebrow} titleLineOne={hero.title_line_1} titleLineOneAccent={hero.title_line_1_accent} titleLineTwo={hero.title_line_2} titleLineTwoAccent={hero.title_line_2_accent} intro="Personal training met Omar, samen trainen met Duo Coaching of begeleiding op afstand met Premium Online Coaching. Bekijk welke vorm past bij jouw doel." primaryCtaHref="/intake?source=home-hero" primaryCtaLabel="Plan een intake" posterSrc={hero.hero_image_url} posterAlt={hero.hero_image_alt} motionMode={hero.motion_hero_accents} />
    <section className="section section--tight" aria-labelledby="offer-title"><div className="site-container"><span className="eyebrow">Onze begeleiding</span><h2 id="offer-title" className="section-title">Welke begeleiding past bij jou?</h2><p className="lead">Kies voor persoonlijke begeleiding, samen trainen of zelfstandig aan de slag gaan.</p><div className="direction-grid kratos-offer-directions">{directions.map(item => <Link key={item.title} href={item.href}><span><strong>{item.title}</strong><small>{item.text}</small></span><ArrowRight aria-hidden="true" /></Link>)}</div><Link className="button button--outline" href="/trajecten">Bekijk alle trajecten <ArrowRight aria-hidden="true" /></Link></div></section>
    <section className="section section--tight editorial-light" aria-labelledby="omar-title"><div className="site-container kratos-omar-intro"><div className="kratos-omar-intro__photo"><Image src={hero.omar_image_url} alt="Omar traint in de fitnessruimte" fill sizes="(max-width: 800px) 100vw, 40vw" /></div><div><span className="eyebrow">Over de coach</span><h2 id="omar-title" className="section-title">Omar.</h2><p className="lead">Maak kennis met Omar, de coach achter KRATOS Fitness.</p><Link className="button button--dark" href="/over-omar">Leer Omar kennen <ArrowRight aria-hidden="true" /></Link></div></div></section>
    <section className="section section--tight" aria-labelledby="method-title"><div className="site-container kratos-short-section"><span className="eyebrow">Onze werkwijze</span><h2 id="method-title" className="section-title">Van aanvraag tot evaluatie.</h2><p>Bekijk hoe persoonlijke coaching werkt en wat je bij iedere stap kunt verwachten.</p><Link className="button button--outline" href="/werkwijze">Bekijk onze werkwijze <ArrowRight aria-hidden="true" /></Link></div></section>
    <section className="section section--tight editorial-light" aria-labelledby="faith-title"><div className="site-container kratos-short-section"><span className="eyebrow">KRATOS Faith &amp; Fitness · Community &amp; events</span><h2 id="faith-title" className="section-title">FAITH. FITNESS. COMMUNITY.</h2><p>Samen trainen, elkaar aanmoedigen en nieuwe mensen ontmoeten. Workouts, challenges, geloof en inspiratie komen samen in onze events.</p><p>KRATOS Faith &amp; Fitness staat los van onze persoonlijke coachingstrajecten.</p><Link className="button button--dark" href="/community">Ontdek Faith &amp; Fitness <ArrowRight aria-hidden="true" /></Link></div></section>
    <section className="section section--tight" data-sticky-final-sentinel><div className="site-container lime-cta"><div><strong>Bespreek jouw doel met Omar.</strong><span>Vertel waar je aan wilt werken en vraag informatie over de begeleiding.</span></div><Link className="button button--dark" href="/intake?source=home-final">Plan een intake <ArrowRight aria-hidden="true" /></Link></div></section>
  </>;
}
