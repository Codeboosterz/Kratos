import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import contact from "@/config/contact.json";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = { title: "Contact", description: "Neem contact op met Kratos Fitness." };

export default async function ContactPage() {
  const content = await getPublishedCmsPage("contact");
  return (
    <section className="section" data-sticky-hero-sentinel data-sticky-final-sentinel>
      <div className="site-container contact-layout">
        <div><span className="eyebrow-pill">{content.hero_eyebrow}</span><h1 className="display-title">{content.hero_title} <span className="lime">{content.hero_accent}</span> {content.hero_suffix}</h1><p className="lead">{content.hero_intro}</p><Link className="button button--primary" href="/intake?source=contact">Plan een intake</Link></div>
        <div className="contact-cards"><a className="contact-card" href={`mailto:${contact.email}`}><Mail aria-hidden="true" /><span><strong>E-mail</strong><small>{contact.email}</small></span></a><a className="contact-card" href={`tel:${contact.phoneHref}`}><Phone aria-hidden="true" /><span><strong>Telefoon</strong><small>{contact.phoneDisplay}</small></span></a><div className="status-panel"><strong>{content.status_title}</strong><p className="muted">{content.status_text}</p></div></div>
      </div>
    </section>
  );
}
