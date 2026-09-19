import type { Metadata } from "next";
import { CookiePreferences } from "@/components/cookie-preferences";

export const metadata: Metadata = { title: "Cookies", description: "Cookie-informatie en lokale voorkeuren van Kratos Fitness." };

export default function CookiesPage() { return <section className="section"><article className="narrow-container policy"><span className="eyebrow-pill">Cookies</span><h1 className="section-title">Jouw voorkeuren</h1><p>De website gebruikt noodzakelijke browseropslag voor je tijdelijke intakeconcept en, wanneer je als beheerder inlogt, voor je sessie. Publieke bezoekers- en prestatiemetingen via Vercel gebruiken geen analyticscookies. Je kunt deze optionele metingen hieronder uitschakelen; je keuze wordt lokaal opgeslagen. Er zijn geen marketingcookies aangesloten.</p><CookiePreferences /><h2>Beheer</h2><p>Je kunt lokale sitegegevens altijd verwijderen via de privacy-instellingen van je browser.</p></article></section>; }
