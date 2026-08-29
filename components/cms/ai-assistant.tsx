"use client";

import { useState } from "react";
import { Copy, LoaderCircle, Sparkles } from "lucide-react";

type Result = { title: string; draft: string; suggestions: string[]; reviewNotes: string[] };

export function CmsAiAssistant() {
  const [result, setResult] = useState<Result | null>(null); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function run(formData: FormData) {
    setPending(true); setError(""); setResult(null);
    const response = await fetch("/api/cms/ai/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: formData.get("purpose"), objective: formData.get("objective"), source: formData.get("source"), tone: formData.get("tone") }) });
    const body = await response.json() as { result?: Result; error?: { message?: string } };
    setPending(false); if (!response.ok || !body.result) setError(body.error?.message ?? "Assistentie mislukt."); else setResult(body.result);
  }
  return <div className="cms-ai-workbench">
    <form action={run} className="cms-panel cms-ai-form"><span className="eyebrow">Mens blijft beslissen</span><h2>Maak een veilig concept.</h2><label>Taak<select name="purpose" defaultValue="rewrite"><option value="rewrite">Herschrijven</option><option value="headlines">Koppen voorstellen</option><option value="summary">Samenvatten</option><option value="email">E-mailconcept</option></select></label><label>Toon<select name="tone" defaultValue="direct"><option value="direct">Direct</option><option value="warm">Warm</option><option value="energetic">Energiek</option></select></label><label className="cms-field--wide">Doel<input name="objective" minLength={5} maxLength={500} placeholder="Wat moet deze tekst bereiken?" required /></label><label className="cms-field--wide">Goedgekeurde brontekst<textarea name="source" rows={12} minLength={20} maxLength={20000} required /></label><button type="submit" disabled={pending}>{pending ? <LoaderCircle className="cms-spin" /> : <Sparkles />} Concept genereren</button>{error ? <p className="cms-message cms-message--error">{error}</p> : null}</form>
    <article className="cms-panel cms-ai-result"><span className="eyebrow">Alleen concept</span>{result ? <><div><h2>{result.title}</h2><button type="button" onClick={() => navigator.clipboard.writeText(result.draft)}><Copy /> Kopieer</button></div><pre>{result.draft}</pre><h3>Suggesties</h3><ul>{result.suggestions.map((item) => <li key={item}>{item}</li>)}</ul><h3>Controlepunten</h3><ul>{result.reviewNotes.map((item) => <li key={item}>{item}</li>)}</ul></> : <div className="cms-ai-empty"><Sparkles /><p>Het gegenereerde concept verschijnt hier en wordt nooit automatisch gepubliceerd.</p></div>}</article>
  </div>;
}
