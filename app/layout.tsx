import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FixtureBanner } from "@/components/fixture-banner";
import { fixtureMode, trustedSiteOrigin } from "@/src/server/environment";
import { getPublishedCmsPage } from "@/src/cms/site-pages";

export const metadata: Metadata = {
  metadataBase: trustedSiteOrigin ? new URL(trustedSiteOrigin) : new URL("https://kratosfitness.be"),
  title: { default: "Kratos Fitness", template: "%s | Kratos Fitness" },
  description: "Persoonlijke training en coaching met een plan dat bij jouw doel en leven past.",
  openGraph: {
    title: "Kratos Fitness — Word sterker. Blijf sterker.",
    description: "Persoonlijke training en coaching met een helder plan.",
    type: "website",
    locale: "nl_BE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kratos Fitness — Word sterker. Blijf sterker.",
    description: "Persoonlijke training en coaching met een helder plan.",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const site = await getPublishedCmsPage("site-settings");
  return (
    <html lang="nl" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Ga naar de inhoud</a>
        {fixtureMode ? <FixtureBanner /> : null}
        <SiteHeader copy={{ results: site.nav_results, method: site.nav_method, trajectories: site.nav_trajectories, about: site.nav_about, tools: site.nav_tools, cta: site.nav_cta }} />
        <main id="main-content">{children}</main>
        <SiteFooter copy={{ tagline: site.footer_tagline, explore: site.footer_explore, policy: site.footer_policy, signature: site.footer_signature, brandTagline: site.brand_tagline }} />
      </body>
    </html>
  );
}
