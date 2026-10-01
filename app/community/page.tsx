import type { Metadata } from "next";
import Image from "next/image";
import { FaithScrollStory } from "@/components/faith-scroll-story";
import { getPublishedHomeHero } from "@/src/cms/home";
import { ArrowRight, BookOpen, Dumbbell, Users } from "lucide-react";
import { getPublishedCmsPage } from "@/src/cms/site-pages";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Faith & Fitness Community",
  description: "Samen bewegen, groeien in geloof en elkaar aanmoedigen. Ontdek de Faith & Fitness community van Kratos.",
  alternates: { canonical: "/community" },
};

const icons = [BookOpen, Dumbbell, Users];

// The community story uses outdoor event imagery instead of this coaching photo.
function communityPhoto<T extends { image_url: string; image_alt: string }>(photo: T): T {
  return photo.image_url === "/images/community/coached-press.jpg"
    ? { ...photo, image_url: "/images/community/team-lunges.jpg", image_alt: "Deelnemers doen samen lunges tijdens de buitentraining in het park." }
    : photo;
}

export default async function CommunityPage() {
  // Keep the registered CMS identity and its revision history; only its public route changes.
  const content = await getPublishedCmsPage("gratis-tools");
  const home = await getPublishedHomeHero();
  const steps = home.faith_story_steps.map((step, index) => ({ ...communityPhoto(step), additional_images: step.additional_images.map(communityPhoto), title: content[`community_story_${index + 1}_title`], text: content[`community_story_${index + 1}_text`] }));
  const socialHref = /^https:\/\/(www\.)?instagram\.com\//.test(content.community_social_url) ? content.community_social_url : "https://www.instagram.com/_kratos_fitness/";
  const facebookHref = /^https:\/\/(www\.)?facebook\.com\//.test(content.community_facebook_url) ? content.community_facebook_url : "https://www.facebook.com/share/1Cn8mGMSm3/";
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`site-container ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <span className="eyebrow-pill">{content.community_hero_eyebrow}</span>
            <h1 className={`display-title ${styles.title}`}>{content.community_hero_title}<br /><span className="lime">{content.community_hero_accent}</span></h1>
            <p className="lead">{content.community_hero_intro}</p>
            <p className={styles.note}>{content.community_final_note}</p>
            <a href={socialHref} target="_blank" rel="noopener noreferrer" className="button button--primary" data-testid="community-social">{content.community_hero_cta}<ArrowRight aria-hidden="true" size={20} /></a>
            <p className={styles.note}>{content.community_hero_note}</p>
          </div>
          <div className={styles.collage}>
            <div className={styles.mainImage}><Image src={content.community_hero_image_url} alt={content.community_hero_image_alt} fill priority sizes="(max-width: 800px) 58vw, 32vw" /></div>
            <div className={styles.sideImage}><Image src={content.community_image_2_url} alt={content.community_image_2_alt} fill loading="eager" sizes="(max-width: 800px) 32vw, 20vw" /></div>
            <div className={styles.sideImage}><Image src={content.community_image_3_url} alt={content.community_image_3_alt} fill sizes="(max-width: 800px) 32vw, 20vw" /></div>
          </div>
        </div>
      </section>
      <section className={`section ${styles.values}`}>
        <div className="site-container">
          <h2 className="section-title">{content.community_values_title} <span className="lime">{content.community_values_accent}</span></h2>
          <div className={styles.valueGrid}>
            {icons.map((Icon, index) => <article className={styles.value} key={index}>
              <Icon aria-hidden="true" size={28} />
              <h3>{content[`community_value_${index + 1}_title`]}</h3>
              <p>{content[`community_value_${index + 1}_text`]}</p>
            </article>)}
          </div>
        </div>
      </section>
      <FaithScrollStory eyebrow="KRATOS Faith & Fitness" title="Samen in beweging." subtitle="Faith. Fitness. Community." intro="Onze community-events staan los van persoonlijke training en coaching." steps={steps} />
      <section className="section section--tight">
        <div className={`site-container ${styles.invite}`}>
          <Users aria-hidden="true" size={34} />
          <h2 className="section-title">{content.community_final_title}<br /><span>{content.community_final_accent}</span></h2>
          <p>{content.community_final_text}</p>
          <a className="button button--primary" href={socialHref} target="_blank" rel="noopener noreferrer" data-testid="community-social">{content.community_hero_cta}<ArrowRight aria-hidden="true" size={20} /></a>
          <p className={styles.note}>{content.community_final_note}</p><a href={facebookHref} target="_blank" rel="noopener noreferrer" className="button button--outline">Volg ons op Facebook</a>
        </div>
      </section>
    </div>
  );
}
