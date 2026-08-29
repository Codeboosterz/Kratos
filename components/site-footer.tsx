"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";

type FooterCopy = { tagline: string; explore: string; policy: string; signature: string; brandTagline: string };

export function SiteFooter({ copy }: { copy: FooterCopy }) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout") || pathname.startsWith("/beheer")) return null;

  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div>
          <Brand tagline={copy.brandTagline} />
          <p>{copy.tagline}</p>
        </div>
        <div>
          <h2>{copy.explore}</h2>
          <Link href="/trajecten">Trajecten</Link>
          <Link href="/resultaten">Resultaten</Link>
          <Link href="/over-omar">Over Omar</Link>
          <Link href="/gratis-tools">Gratis tools</Link>
        </div>
        <div>
          <h2>{copy.policy}</h2>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/voorwaarden">Voorwaarden</Link>
          <Link href="/cookies">Cookies</Link>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>© {new Date().getFullYear()} Kratos Fitness</span>
        <span>{copy.signature}</span>
      </div>
    </footer>
  );
}
