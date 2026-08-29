"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  Bot,
  Boxes,
  CalendarDays,
  Files,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  ReceiptText,
  Settings2,
} from "lucide-react";

const navigationItems = [
  { href: "/beheer", label: "Overzicht", icon: LayoutDashboard },
  { href: "/beheer/website", label: "Website", icon: Files },
  { href: "/beheer/media", label: "Media", icon: ImageIcon },
  { href: "/beheer/producten", label: "Producten", icon: Boxes },
  { href: "/beheer/bestellingen", label: "Bestellingen", icon: ReceiptText },
  { href: "/beheer/afspraken", label: "Afspraken", icon: CalendarDays },
  { href: "/beheer/inbox", label: "Inbox", icon: Inbox },
  { href: "/beheer/ai", label: "AI & tools", icon: Bot },
  { href: "/beheer/monitoring", label: "Monitoring", icon: ActivitySquare },
  { href: "/beheer/instellingen", label: "Instellingen", icon: Settings2 },
];

export function CmsShellNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Beheernavigatie">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/beheer" ? pathname === href : pathname.startsWith(href);
        return (
          <Link href={href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined} key={href}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
