import { Calculator, LockKeyhole } from "lucide-react";

export function ToolCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="tool-card">
      <Calculator aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="disabled-reason"><LockKeyhole aria-hidden="true" size={18} /><span><strong>Binnenkort</strong> Formule en toelichting worden eerst inhoudelijk goedgekeurd.</span></div>
      <button className="button button--outline" type="button" disabled>Beschikbaar in een volgende update</button>
    </article>
  );
}
