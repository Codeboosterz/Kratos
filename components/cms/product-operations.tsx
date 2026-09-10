"use client";

import { useState } from "react";
import { FileUp, LoaderCircle, Sparkles } from "lucide-react";

export function ProductOperations({ productId, disabled }: { productId: string; disabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "generate" | null>(null);

  async function uploadPdf(formData: FormData) {
    if (busy || disabled) return;
    setBusy("upload"); setMessage(null); formData.set("productId", productId);
    try {
    const response = await fetch("/api/cms/digital-assets", { method: "POST", body: formData });
    const result = await response.json() as { message?: string; error?: { message?: string } };
    setMessage(response.ok ? result.message ?? "PDF veilig gekoppeld." : result.error?.message ?? "Upload mislukt.");
    if (response.ok) window.location.reload();
    } catch { setMessage("Geen bevestiging ontvangen. Controleer je verbinding en de productkoppeling voordat je opnieuw uploadt. Je invoer blijft staan."); }
    finally { setBusy(null); }
  }

  async function generatePdf(formData: FormData) {
    if (busy || disabled) return;
    setBusy("generate"); setMessage(null);
    try {
    const response = await fetch("/api/cms/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        title: formData.get("title"),
        audience: formData.get("audience"),
        objective: formData.get("objective"),
        sourceNotes: formData.get("sourceNotes"),
      }),
    });
    const result = await response.json() as { message?: string; error?: { message?: string } };
    setMessage(response.ok ? result.message ?? "PDF gegenereerd en gekoppeld." : result.error?.message ?? "Genereren mislukt.");
    if (response.ok) window.location.reload();
    } catch { setMessage("Geen bevestiging ontvangen. Controleer Monitoring voordat je opnieuw genereert om dubbele kosten te voorkomen. Je invoer blijft staan."); }
    finally { setBusy(null); }
  }

  return (
    <details className="cms-product-assets">
      <summary>PDF & levering beheren</summary>
      <div>
        <form onSubmit={event => { event.preventDefault(); void uploadPdf(new FormData(event.currentTarget)); }} className="cms-product-upload">
          <label><FileUp aria-hidden="true" /><span><strong>Bestaande PDF uploaden</strong><small>Privé opgeslagen, maximaal 20 MB.</small></span></label>
          <input name="file" aria-label="PDF-bestand" type="file" accept="application/pdf,.pdf" disabled={disabled || busy !== null} required />
          <button type="submit" disabled={disabled || busy !== null}>{busy === "upload" ? <LoaderCircle className="cms-spin" aria-hidden="true" /> : null} Upload & koppel</button>
        </form>
        <form onSubmit={event => { event.preventDefault(); void generatePdf(new FormData(event.currentTarget)); }} className="cms-product-ai">
          <label><Sparkles aria-hidden="true" /><span><strong>AI-PDF genereren</strong><small>Claude 4.6 of de geconfigureerde Sol 5.6-backend. Nooit automatisch publiceren.</small></span></label>
          <input name="title" aria-label="Titel" placeholder="Titel" minLength={2} maxLength={120} disabled={disabled || busy !== null} required />
          <input name="audience" aria-label="Doelgroep" placeholder="Doelgroep" minLength={2} maxLength={240} disabled={disabled || busy !== null} required />
          <input name="objective" aria-label="Doel van het document" placeholder="Doel van het document" minLength={2} maxLength={600} disabled={disabled || busy !== null} required />
          <textarea name="sourceNotes" aria-label="Goedgekeurde bronnotities" placeholder="Goedgekeurde bronnotities (minimaal 20 tekens)" minLength={20} maxLength={20000} rows={6} disabled={disabled || busy !== null} required />
          <button type="submit" disabled={disabled || busy !== null}>{busy === "generate" ? <LoaderCircle className="cms-spin" aria-hidden="true" /> : null} Genereer concept-PDF</button>
        </form>
        {message ? <p className="cms-operation-feedback" role="status">{message}</p> : null}
      </div>
    </details>
  );
}
