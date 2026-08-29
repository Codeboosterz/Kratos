import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { CmsLoginForm } from "@/components/cms/login-form";
import { getCmsMembership } from "@/src/cms/auth";
import { isSupabaseConfigured } from "@/src/supabase/config";

export const metadata: Metadata = { title: "Inloggen — Kratos Beheer", robots: { index: false, follow: false } };

export default async function CmsLoginPage() {
  const configured = isSupabaseConfigured();

  if (configured && await getCmsMembership()) {
    redirect("/beheer");
  }

  return (
    <main className="cms-login-page">
      <section className="cms-login-card" aria-labelledby="cms-login-title">
        <Brand />
        <div>
          <span className="eyebrow">Kratos beheer</span>
          <h1 id="cms-login-title">Welkom terug.</h1>
          <p>Beheer de website, publiceer wijzigingen en houd de media overzichtelijk.</p>
        </div>
        {!configured ? (
          <div className="cms-message" role="status">
            <strong>Eenmalige configuratie nodig</strong>
            <span>De beheeromgeving staat klaar. Koppel de Supabase-projectgegevens om inloggen te activeren.</span>
          </div>
        ) : null}
        <CmsLoginForm />
        <p className="cms-secure-note"><ShieldCheck aria-hidden="true" size={17} /> Alleen goedgekeurde eigenaaraccounts hebben toegang.</p>
      </section>
    </main>
  );
}
