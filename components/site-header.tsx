"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/brand";

type HeaderCopy = { results: string; method: string; trajectories: string; about: string; tools: string; cta: string };

export function SiteHeader({ copy }: { copy: HeaderCopy }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const checkout = pathname.startsWith("/checkout");
  const navItems = [[copy.results, "/resultaten"], [copy.method, "/werkwijze"], [copy.trajectories, "/trajecten"], [copy.about, "/over-omar"], [copy.tools, "/gratis-tools"]] as const;

  if (pathname.startsWith("/beheer")) return null;

  if (checkout) {
    return (
      <header className="checkout-header">
        <div className="site-container"><Brand /></div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="site-container site-header__inner">
        <Brand compact />
        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button button--outline header-cta" href="/intake?source=header">
          {copy.cta}
        </Link>
        <button
          type="button"
          className="menu-button"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobiele navigatie">
          {navItems.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="button button--primary" href="/intake?source=mobile-menu" onClick={() => setOpen(false)}>{copy.cta}</Link>
        </nav>
      ) : null}
    </header>
  );
}
