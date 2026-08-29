import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="narrow-container empty-state">
        <span className="eyebrow">404</span>
        <h1 className="section-title">Dit traject is niet beschikbaar.</h1>
        <p>De pagina bestaat niet of het traject staat niet actief in de bevestigde catalogus.</p>
        <Link className="button button--primary" href="/trajecten">Bekijk trajecten</Link>
      </div>
    </section>
  );
}
