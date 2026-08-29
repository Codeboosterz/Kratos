"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ExternalLink, ImageIcon, Save, Send } from "lucide-react";
import { publishStructuredPageRevision, saveStructuredPageRevision, type CmsActionState } from "@/app/beheer/(protected)/website/actions";
import type { CmsPageDefinition } from "@/src/cms/site-page-definitions";

const initialActionState: CmsActionState = {};

type Props = {
  definition: CmsPageDefinition;
  initialContent: Record<string, string>;
  draftRevisionId: string | null;
  draftVersion: number | null;
  publishedVersion: number | null;
  canPublish: boolean;
  media: { public_url: string; filename: string; alt_text: string }[];
  isRegistered: boolean;
};

export function StructuredPageEditor({ definition, initialContent, draftRevisionId, draftVersion, publishedVersion, canPublish, media, isRegistered }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saveState, saveAction, saving] = useActionState(saveStructuredPageRevision, initialActionState);
  const [publishState, publishAction, publishing] = useActionState(publishStructuredPageRevision, initialActionState);
  const publishableRevisionId = saveState.revisionId || draftRevisionId;
  const publishableVersion = saveState.version || draftVersion;
  const sections = Array.from(new Set(definition.fields.map((item) => item.section)));
  const previewImage = definition.fields.find((item) => item.kind === "image")?.key;
  const previewTitle = content.hero_title || content.final_title || definition.title;
  const previewAccent = content.hero_accent || content.final_accent || "";

  return (
    <div className="cms-editor-grid">
      <section className="cms-panel cms-editor-panel">
        <div className="cms-panel__heading"><div><span className="eyebrow">Inhoud</span><h2>{definition.title}</h2></div><span className="cms-version-badge">Live: v{publishedVersion ?? "—"}</span></div>
        {!isRegistered ? <p className="cms-message cms-message--error">Deze pagina moet eerst via de meegeleverde Supabase-migratie worden geregistreerd voordat je kunt opslaan.</p> : null}
        <form action={saveAction} className="cms-editor-form">
          <input type="hidden" name="page_slug" value={definition.slug} />
          {sections.map((section) => <fieldset className="cms-motion-settings" key={section}><legend><strong>{section}</strong></legend><div className="cms-two-column">{definition.fields.filter((item) => item.section === section).map((item) => <div className={`field${item.kind === "textarea" ? " cms-field--wide" : ""}`} key={item.key}><label htmlFor={item.key}>{item.label}</label>{item.kind === "textarea" ? <textarea id={item.key} name={item.key} rows={4} maxLength={item.maxLength ?? 520} value={content[item.key]} onChange={(event) => setContent((current) => ({ ...current, [item.key]: event.target.value }))} /> : <div className={item.kind === "image" ? "cms-media-input" : undefined}>{item.kind === "image" ? <ImageIcon aria-hidden="true" /> : null}<input id={item.key} name={item.key} list={item.kind === "image" ? "structured-media-options" : undefined} maxLength={item.maxLength ?? (item.kind === "image" ? 1000 : 140)} value={content[item.key]} onChange={(event) => setContent((current) => ({ ...current, [item.key]: event.target.value }))} /></div>}{saveState.fieldErrors?.[item.key]?.map((error) => <small className="field-error" key={error}>{error}</small>)}</div>)}</div></fieldset>)}
          <datalist id="structured-media-options">{media.map((item) => <option key={item.public_url} value={item.public_url}>{item.filename}</option>)}</datalist>
          <p className="cms-message"><span>Veilige editor</span> Afmetingen, kleuren, animaties, formulieren en commerciële instellingen zijn vergrendeld. Je wijzigt alleen gecontroleerde inhoud.</p>
          <div className="field"><label htmlFor="change_summary">Notitie bij deze versie</label><input id="change_summary" name="change_summary" maxLength={240} placeholder="Bijvoorbeeld: intro en beeld bijgewerkt" /></div>
          {saveState.message ? <p className={`cms-message cms-message--${saveState.status}`} role="status">{saveState.message}</p> : null}
          <button className="button button--outline" type="submit" disabled={!isRegistered || saving}><Save aria-hidden="true" size={18} /> {saving ? "Concept opslaan…" : "Concept opslaan"}</button>
        </form>
        <form action={publishAction} className="cms-publish-bar">
          <input type="hidden" name="page_slug" value={definition.slug} /><input type="hidden" name="revision_id" value={publishableRevisionId || ""} />
          <div><strong>{publishableVersion ? `Concept v${publishableVersion} klaar` : "Sla eerst een concept op"}</strong><span>Publiceren vervangt alleen deze pagina.</span></div>
          <button className="button button--primary" type="submit" disabled={!canPublish || !publishableRevisionId || publishing}><Send aria-hidden="true" size={18} /> {publishing ? "Publiceren…" : "Nu publiceren"}</button>
        </form>
        {publishState.message ? <p className={`cms-message cms-message--${publishState.status}`} role="status">{publishState.message}</p> : null}
      </section>
      <aside className="cms-preview-column">
        <div className="cms-preview-toolbar"><div><span className="cms-live-dot" /> Inhoudsvoorbeeld</div><Link href={definition.route} target="_blank">Open pagina <ExternalLink aria-hidden="true" size={15} /></Link></div>
        <div className="cms-page-preview">
          {previewImage ? <div className="cms-page-preview__image" style={{ backgroundImage: `linear-gradient(0deg, rgba(8,10,8,.82), transparent), url(${JSON.stringify(content[previewImage]).slice(1, -1)})` }} /> : null}
          <div><span>{content.hero_eyebrow || definition.title}</span><h2>{previewTitle} <em>{previewAccent}</em></h2><p>{content.hero_intro || definition.description}</p></div>
        </div>
      </aside>
    </div>
  );
}
