import type { Metadata } from "next";
import { CookiePreferences } from "@/components/cookie-preferences";

export const metadata: Metadata = { title: "Cookies", description: "Cookie-informatie en lokale voorkeuren van Kratos Fitness." };

export default function CookiesPage() { return <section className="section"><article className="narrow-container policy"><span className="eyebrow-pill">Cookies</span><h1 className="section-title">Jouw voorkeuren</h1><p>Deze build plaatst geen analytics- of marketingcookies. De knop hieronder bewaart alleen je essentiële voorkeur lokaal in je browser. Als later andere categorieën worden aangesloten, moeten doel, bewaartermijn en toestemming eerst expliciet worden bijgewerkt.</p><CookiePreferences /><h2>Beheer</h2><p>Je kunt lokale sitegegevens altijd verwijderen via de privacy-instellingen van je browser.</p></article></section>; }
