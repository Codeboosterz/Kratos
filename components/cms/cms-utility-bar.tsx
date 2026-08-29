"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpRight, Inbox, Search, ShieldCheck } from "lucide-react";

const destinations = [
  { href: "/beheer", label: "Overzicht", keywords: "dashboard status" },
  { href: "/beheer/website", label: "Website bewerken", keywords: "pagina inhoud publicatie" },
  { href: "/beheer/media", label: "Media", keywords: "afbeeldingen upload bestanden" },
  { href: "/beheer/producten", label: "Producten", keywords: "pdf prijzen stripe" },
  { href: "/beheer/bestellingen", label: "Bestellingen", keywords: "orders fulfillment toegang" },
  { href: "/beheer/afspraken", label: "Afspraken", keywords: "calendly agenda intake kalender boekingen" },
  { href: "/beheer/inbox", label: "Inbox", keywords: "resend mail klanten" },
  { href: "/beheer/ai", label: "AI & tools", keywords: "openrouter claude usage" },
  { href: "/beheer/monitoring", label: "Monitoring", keywords: "fouten herstel webhook" },
  { href: "/beheer/instellingen", label: "Instellingen", keywords: "integraties api keys" },
];

type CmsUtilityBarProps = {
  ownerName: string;
  roleLabel: string;
};

export function CmsUtilityBar({ ownerName, roleLabel }: CmsUtilityBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("nl-BE");
    if (!normalized) return destinations;
    return destinations.filter((item) => `${item.label} ${item.keywords}`.toLocaleLowerCase("nl-BE").includes(normalized));
  }, [query]);
  const initials = ownerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <header className="cms-utility-bar">
      <form
        className="cms-command-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (matches[0]) {
            router.push(matches[0].href);
            setFocused(false);
          }
        }}
      >
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="cms-destination-search">Zoek in beheer</label>
        <input
          id="cms-destination-search"
          type="search"
          placeholder="Ga naar een onderdeel"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
              event.currentTarget.blur();
            }
          }}
          autoComplete="off"
        />
        <kbd>Enter</kbd>
        {focused && query ? (
          <div className="cms-command-results" role="listbox" aria-label="Beheeronderdelen">
            {matches.length ? matches.slice(0, 5).map((item) => (
              <Link href={item.href} role="option" aria-selected="false" key={item.href}>
                <span>{item.label}</span><ArrowUpRight aria-hidden="true" />
              </Link>
            )) : <p>Geen onderdeel gevonden.</p>}
          </div>
        ) : null}
      </form>

      <div className="cms-utility-actions">
        <Link href="/beheer/inbox" className="cms-icon-link" aria-label="Open inbox"><Inbox aria-hidden="true" /></Link>
        <Link href="/beheer/monitoring" className="cms-icon-link" aria-label="Open monitoring"><ShieldCheck aria-hidden="true" /></Link>
        <div className="cms-user-chip">
          <span aria-hidden="true">{initials || "K"}</span>
          <div><strong>{ownerName}</strong><small>{roleLabel}</small></div>
        </div>
      </div>
    </header>
  );
}
