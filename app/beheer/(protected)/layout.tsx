import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { CmsShellNavigation } from "@/components/cms/cms-shell-navigation";
import { CmsUtilityBar } from "@/components/cms/cms-utility-bar";
import { logout } from "@/app/beheer/login/actions";
import { requireCmsMembership } from "@/src/cms/auth";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await requireCmsMembership();
  const roleLabel = membership.role === "super_admin" ? "Super admin" : membership.role === "owner" ? "Eigenaar" : "Editor";
  const ownerName = membership.display_name || roleLabel;

  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <div className="cms-sidebar__brand">
          <Link href="/beheer" aria-label="Kratos Beheer — overzicht">
            <Image src="/img/Transparent logo.png" width={44} height={44} alt="" priority />
            <span><strong>Kratos</strong><small>Beheer</small></span>
          </Link>
        </div>
        <span className="cms-nav-label">Werkruimte</span>
        <CmsShellNavigation />
        <div className="cms-sidebar__account">
          <span>{ownerName}</span><small>{roleLabel}</small>
          <form action={logout}><button type="submit"><LogOut aria-hidden="true" /> Uitloggen</button></form>
        </div>
      </aside>
      <div className="cms-workspace">
        <CmsUtilityBar ownerName={ownerName} roleLabel={roleLabel} />
        {children}
      </div>
    </div>
  );
}
