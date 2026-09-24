import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, Dumbbell, Users } from "lucide-react";
import { getPublishedCmsPage } from "@/src/cms/site-pages";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Faith & Fitness Community", description: "KRATOS Faith & Fitness brengt mensen samen voor workouts, geloof en verbinding.", alternates: { canonical: "/community" } };
const pillars = [
  { icon: Dumbbell, title: "Samen bewegen", text: "Gezamenlijke workouts, challenges en teamwork." },
  { icon: BookOpen, title: "Inspiratie", text: "Ruimte voor geloof, inspiratie en persoonlijke groei." },
  { icon: Users, title: "Verbinding", text: "Nieuwe mensen ontmoeten en elkaar aanmoedigen." },
];
export default async function CommunityPage() {
  const content = await getPublishedCmsPage("gratis-tools");
  return <div className={styles.page}>
    <section className={styles.hero}><div className={`site-container ${styles.heroGrid}`}><div className={styles.copy}><span className="eyebrow-pill">KRATOS Faith &amp; Fitness</span><h1 className={`display-title ${styles.title}`}>FAITH.<br />FITNESS.<br /><span className="lime">COMMUNITY.</span></h1><p className="lead">{content.community_event_intro}</p><p>{content.community_event_separation}</p></div><div className={styles.collage}><div className={styles.mainImage}><Image src={content.community_hero_image_url} alt={content.community_hero_image_alt} fill priority sizes="(max-width: 800px) 58vw, 32vw" /></div><div className={styles.sideImage}><Image src={content.community_image_2_url} alt={content.community_image_2_alt} fill sizes="(max-width: 800px) 32vw, 20vw" /></div><div className={styles.sideImage}><Image src={content.community_image_3_url} alt={content.community_image_3_alt} fill sizes="(max-width: 800px) 32vw, 20vw" /></div></div></div></section>
    <section className={`section ${styles.values}`}><div className="site-container"><h2 className="section-title">Samen sterker.</h2><p>{content.community_event_details}</p><div className={styles.valueGrid}>{pillars.map(({ icon: Icon, title, text }) => <article className={styles.value} key={title}><Icon aria-hidden="true" size={28} /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="section section--tight"><div className={`site-container ${styles.invite}`}><Users aria-hidden="true" size={34} /><h2 className="section-title">Doe mee met de community.</h2><p>{content.community_event_follow}</p></div></section>
  </div>;
}
