"use client";

import { useState } from "react";
import { FileUp, LoaderCircle, Sparkles } from "lucide-react";

export function ProductOperations({ productId, disabled }: { productId: string; disabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "generate" | null>(null);

  async function uploadPdf(formData: FormData) {
    setBusy("upload"); setMessage(null); formData.set("productId", productId);
    const response = await fetch("/api/cms/digital-assets", { method: "POST", body: formData });
    const result = await response.json() as { message?: string; error?: { message?: string } };
    setBusy(null); setMessage(response.ok ? result.message ?? "PDF veilig gekoppeld." : result.error?.message ?? "Upload mislukt.");
    if (response.ok) window.location.reload();
  }

  async function generatePdf(formData: FormData) {
    setBusy("generate"); setMessage(null);
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
    setBusy(null); setMessage(response.ok ? result.message ?? "PDF gegenereerd en gekoppeld." : result.error?.message ?? "Genereren mislukt.");
    if (response.ok) window.location.reload();
  }

  return (
    <details className="cms-product-assets">
      <summary>PDF & levering beheren</summary>
      <div>
        <form action={uploadPdf} className="cms-product-upload">
          <label><FileUp aria-hidden="true" /><span><strong>Bestaande PDF uploaden</strong><small>Privé opgeslagen, maximaal 20 MB.</small></span></label>
          <input name="file" type="file" accept="application/pdf,.pdf" disabled={disabled || busy !== null} required />
          <button type="submit" disabled={disabled || busy !== null}>{busy === "upload" ? <LoaderCircle className="cms-spin" aria-hidden="true" /> : null} Upload & koppel</button>
        </form>
        <form action={generatePdf} className="cms-product-ai">
          <label><Sparkles aria-hidden="true" /><span><strong>AI-PDF genereren</strong><small>Claude 4.6 of de geconfigureerde Sol 5.6-backend. Nooit automatisch publiceren.</small></span></label>
          <input name="title" placeholder="Titel" minLength={2} maxLength={120} disabled={disabled || busy !== null} required />
          <input name="audience" placeholder="Doelgroep" minLength={2} maxLength={240} disabled={disabled || busy !== null} required />
          <input name="objective" placeholder="Doel van het document" minLength={2} maxLength={600} disabled={disabled || busy !== null} required />
          <textarea name="sourceNotes" placeholder="Goedgekeurde bronnotities (minimaal 20 tekens)" minLength={20} maxLength={20000} rows={6} disabled={disabled || busy !== null} required />
          <button type="submit" disabled={disabled || busy !== null}>{busy === "generate" ? <LoaderCircle className="cms-spin" aria-hidden="true" /> : null} Genereer concept-PDF</button>
        </form>
        {message ? <p className="cms-operation-feedback" role="status">{message}</p> : null}
      </div>
    </details>
  );
}
