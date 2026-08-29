"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="narrow-container empty-state">
        <span className="eyebrow">Er ging iets mis</span>
        <h1 className="section-title">We konden deze pagina niet laden.</h1>
        <p>Probeer het opnieuw. Je kunt ook veilig terug naar het overzicht.</p>
        <div className="hero__actions"><button className="button button--primary" type="button" onClick={reset}>Opnieuw proberen</button><Link className="button button--outline" href="/trajecten">Bekijk trajecten</Link></div>
      </div>
    </section>
  );
}
