"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ImagePlus, UploadCloud } from "lucide-react";
import { createClient } from "@/src/supabase/client";

type Asset = {
  id: string;
  public_url: string;
  filename: string;
  alt_text: string;
  size_bytes: number;
  created_at: string;
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function MediaLibrary({ assets, userId }: { assets: Asset[]; userId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "success"; message?: string }>({ kind: "idle" });
  const [copied, setCopied] = useState<string | null>(null);

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return setStatus({ kind: "error", message: "Kies eerst een afbeelding." });
    if (!allowedTypes.has(file.type)) return setStatus({ kind: "error", message: "Gebruik JPG, PNG, WebP of AVIF." });
    if (file.size > 8 * 1024 * 1024) return setStatus({ kind: "error", message: "De afbeelding mag maximaal 8 MB zijn." });

    setStatus({ kind: "loading", message: "Afbeelding uploaden…" });
    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `website/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("site-media").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) return setStatus({ kind: "error", message: "Uploaden is niet gelukt. Probeer het opnieuw." });

    const { data: publicData } = supabase.storage.from("site-media").getPublicUrl(storagePath);
    const { error: metadataError } = await supabase.from("media_assets").insert({
      storage_path: storagePath,
      public_url: publicData.publicUrl,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText.trim(),
      created_by: userId,
    });

    if (metadataError) {
      await supabase.storage.from("site-media").remove([storagePath]);
      return setStatus({ kind: "error", message: "Het bestand is niet geregistreerd en is daarom weer verwijderd." });
    }

    if (fileInput.current) fileInput.current.value = "";
    setAltText("");
    setStatus({ kind: "success", message: "De afbeelding staat in de mediabibliotheek." });
    router.refresh();
  }

  async function copyUrl(id: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <>
      <section className="cms-panel cms-upload-panel">
        <div><ImagePlus aria-hidden="true" /><div><h2>Nieuwe afbeelding</h2><p>JPG, PNG, WebP of AVIF · maximaal 8 MB</p></div></div>
        <div className="cms-upload-controls">
          <div className="field"><label htmlFor="media-file">Bestand</label><input ref={fileInput} id="media-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></div>
          <div className="field"><label htmlFor="media-alt">Alternatieve tekst</label><input id="media-alt" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={240} placeholder="Beschrijf wat op de afbeelding staat" /></div>
          <button className="button button--primary" type="button" onClick={upload} disabled={status.kind === "loading"}><UploadCloud aria-hidden="true" /> {status.kind === "loading" ? "Uploaden…" : "Uploaden"}</button>
        </div>
        {status.message ? <p className={`cms-message cms-message--${status.kind}`} role="status">{status.message}</p> : null}
      </section>

      {assets.length ? (
        <section className="cms-media-grid" aria-label="Mediabibliotheek">
          {assets.map((asset) => (
            <article key={asset.id} className="cms-media-card">
              {/* Supabase URLs are owner-uploaded and constrained by the media bucket. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.public_url} alt={asset.alt_text} />
              <div><strong>{asset.filename}</strong><span>{(asset.size_bytes / 1024 / 1024).toFixed(1)} MB · {new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium" }).format(new Date(asset.created_at))}</span><small>{asset.alt_text || "Decoratief beeld"}</small></div>
              <button type="button" onClick={() => copyUrl(asset.id, asset.public_url)}>{copied === asset.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied === asset.id ? "Gekopieerd" : "Kopieer URL"}</button>
            </article>
          ))}
        </section>
      ) : <div className="cms-panel cms-empty"><ImagePlus aria-hidden="true" /><h2>Nog geen media</h2><p>Upload hierboven je eerste website-afbeelding.</p></div>}
    </>
  );
}
