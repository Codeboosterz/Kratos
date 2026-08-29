import Link from "next/link";
import { ShieldX } from "lucide-react";
import { logout } from "@/app/beheer/login/actions";

export default function NoCmsAccessPage() {
  return (
    <main className="cms-login-page">
      <section className="cms-login-card">
        <ShieldX className="cms-large-icon" aria-hidden="true" />
        <div><span className="eyebrow">Geen toegang</span><h1>Account niet geautoriseerd.</h1></div>
        <p>Vraag de websitebeheerder om dit account als eigenaar of editor toe te voegen.</p>
        <form action={logout}><button className="button button--outline" type="submit">Uitloggen</button></form>
        <Link href="/">Terug naar de website</Link>
      </section>
    </main>
  );
}
