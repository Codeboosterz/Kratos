"use client";

import { useState } from "react";
import { Copy, LoaderCircle, Sparkles } from "lucide-react";

type Result = { title: string; draft: string; suggestions: string[]; reviewNotes: string[] };

export function CmsAiAssistant() {
  const [result, setResult] = useState<Result | null>(null); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function run(formData: FormData) {
    if (pending) return;
    setPending(true); setError(""); setResult(null);
    try {
    const response = await fetch("/api/cms/ai/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: formData.get("purpose"), objective: formData.get("objective"), source: formData.get("source"), tone: formData.get("tone") }) });
    const body = await response.json() as { result?: Result; error?: { message?: string } };
    if (!response.ok || !body.result) setError(body.error?.message ?? "Assistentie mislukt."); else setResult(body.result);
    } catch { setError("Geen bevestiging ontvangen. Controleer Monitoring en je verbinding voordat je opnieuw genereert. Je invoer blijft staan."); }
    finally { setPending(false); }
  }
  async function copyDraft() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.draft); }
    catch { setError("Kopiëren is geblokkeerd. Selecteer de concepttekst en kopieer deze handmatig."); }
  }
  return <div className="cms-ai-workbench">
    <form onSubmit={event => { event.preventDefault(); void run(new FormData(event.currentTarget)); }} className="cms-panel cms-ai-form"><span className="eyebrow">Mens blijft beslissen</span><h2>Maak een veilig concept.</h2><label>Taak<select name="purpose" defaultValue="rewrite"><option value="rewrite">Herschrijven</option><option value="headlines">Koppen voorstellen</option><option value="summary">Samenvatten</option><option value="email">E-mailconcept</option></select></label><label>Toon<select name="tone" defaultValue="direct"><option value="direct">Direct</option><option value="warm">Warm</option><option value="energetic">Energiek</option></select></label><label className="cms-field--wide">Doel<input name="objective" minLength={5} maxLength={500} placeholder="Wat moet deze tekst bereiken?" required /></label><label className="cms-field--wide">Goedgekeurde brontekst<textarea name="source" rows={12} minLength={20} maxLength={20000} required /></label><button type="submit" disabled={pending}>{pending ? <LoaderCircle className="cms-spin" /> : <Sparkles />} Concept genereren</button>{error ? <p className="cms-message cms-message--error" role="alert">{error}</p> : null}</form>
    <article className="cms-panel cms-ai-result"><span className="eyebrow">Alleen concept</span>{result ? <><div><h2>{result.title}</h2><button type="button" onClick={copyDraft}><Copy /> Kopieer</button></div><pre>{result.draft}</pre><h3>Suggesties</h3><ul>{result.suggestions.map((item) => <li key={item}>{item}</li>)}</ul><h3>Controlepunten</h3><ul>{result.reviewNotes.map((item) => <li key={item}>{item}</li>)}</ul></> : <div className="cms-ai-empty"><Sparkles /><p>Het gegenereerde concept verschijnt hier en wordt nooit automatisch gepubliceerd.</p></div>}</article>
  </div>;
}
