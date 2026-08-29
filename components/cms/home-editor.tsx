"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, ImageIcon, Plus, Save, Send, Trash2 } from "lucide-react";
import { publishHomeRevision, saveHomeRevision, type CmsActionState } from "@/app/beheer/(protected)/website/actions";
import type { HomeHeroContent } from "@/src/cms/home";

const initialActionState: CmsActionState = {};

type Props = {
  initialContent: HomeHeroContent;
  draftRevisionId: string | null;
  draftVersion: number | null;
  publishedVersion: number | null;
  canPublish: boolean;
  media: { public_url: string; filename: string; alt_text: string }[];
};

export function HomeEditor({ initialContent, draftRevisionId, draftVersion, publishedVersion, canPublish, media }: Props) {
  const [preview, setPreview] = useState(initialContent);
  const [saveState, saveAction, saving] = useActionState(saveHomeRevision, initialActionState);
  const [publishState, publishAction, publishing] = useActionState(publishHomeRevision, initialActionState);
  const publishableRevisionId = saveState.revisionId || draftRevisionId;
  const publishableVersion = saveState.version || draftVersion;

  function update(name: keyof HomeHeroContent, value: HomeHeroContent[keyof HomeHeroContent]) {
    setPreview((current) => ({ ...current, [name]: value }) as HomeHeroContent);
  }

  function updateFaithStep(index: number, key: keyof HomeHeroContent["faith_story_steps"][number], value: string) {
    update("faith_story_steps", preview.faith_story_steps.map((step, stepIndex) => stepIndex === index ? { ...step, [key]: value } : step));
  }

  function addFaithStep() {
    if (preview.faith_story_steps.length >= 12) return;
    const fallbackImage = media[0]?.public_url || preview.faith_story_steps.at(-1)?.image_url || "/images/omar-deadlift.jpg";
    update("faith_story_steps", [
      ...preview.faith_story_steps,
      {
        title: `Nieuwe verhaalstap ${preview.faith_story_steps.length + 1}`,
        text: "Vertel hier het volgende hoofdstuk van het Faith & Fitness-verhaal.",
        image_url: fallbackImage,
        image_alt: "",
      },
    ]);
  }

  function removeFaithStep(index: number) {
    if (preview.faith_story_steps.length <= 3) return;
    update("faith_story_steps", preview.faith_story_steps.filter((_, stepIndex) => stepIndex !== index));
  }

  function moveFaithStep(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= preview.faith_story_steps.length) return;
    const reordered = [...preview.faith_story_steps];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    update("faith_story_steps", reordered);
  }

  function updateReview(index: number, key: keyof HomeHeroContent["review_cards"][number], value: string) {
    update("review_cards", preview.review_cards.map((card, cardIndex) => cardIndex === index ? { ...card, [key]: value } : card));
  }

  return (
    <div className="cms-editor-grid">
      <section className="cms-panel cms-editor-panel">
        <div className="cms-panel__heading">
          <div><span className="eyebrow">Inhoud</span><h2>Homepage hero</h2></div>
          <span className="cms-version-badge">Live: v{publishedVersion ?? "—"}</span>
        </div>
        <form action={saveAction} className="cms-editor-form">
          <div className="field"><label htmlFor="eyebrow">Bovenregel</label><input id="eyebrow" name="eyebrow" value={preview.eyebrow} onChange={(event) => update("eyebrow", event.target.value)} />{saveState.fieldErrors?.eyebrow?.map((error) => <small className="field-error" key={error}>{error}</small>)}</div>
          <div className="cms-two-column">
            <div className="field"><label htmlFor="title_line_1">Kopregel 1</label><input id="title_line_1" name="title_line_1" value={preview.title_line_1} onChange={(event) => update("title_line_1", event.target.value)} /></div>
            <div className="field"><label htmlFor="title_line_1_accent">Groen woord 1</label><input id="title_line_1_accent" name="title_line_1_accent" value={preview.title_line_1_accent} onChange={(event) => update("title_line_1_accent", event.target.value)} /></div>
            <div className="field"><label htmlFor="title_line_2">Kopregel 2</label><input id="title_line_2" name="title_line_2" value={preview.title_line_2} onChange={(event) => update("title_line_2", event.target.value)} /></div>
            <div className="field"><label htmlFor="title_line_2_accent">Groen woord 2</label><input id="title_line_2_accent" name="title_line_2_accent" value={preview.title_line_2_accent} onChange={(event) => update("title_line_2_accent", event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="intro">Introductie</label><textarea id="intro" name="intro" rows={4} value={preview.intro} onChange={(event) => update("intro", event.target.value)} />{saveState.fieldErrors?.intro?.map((error) => <small className="field-error" key={error}>{error}</small>)}</div>
          <div className="cms-two-column">
            <div className="field"><label htmlFor="primary_cta_label">Hoofdknop</label><input id="primary_cta_label" name="primary_cta_label" value={preview.primary_cta_label} onChange={(event) => update("primary_cta_label", event.target.value)} /></div>
            <div className="field"><label htmlFor="primary_cta_href">Link hoofdknop</label><input id="primary_cta_href" name="primary_cta_href" value={preview.primary_cta_href} onChange={(event) => update("primary_cta_href", event.target.value)} /></div>
            <div className="field"><label htmlFor="secondary_cta_label">Tweede knop</label><input id="secondary_cta_label" name="secondary_cta_label" value={preview.secondary_cta_label} onChange={(event) => update("secondary_cta_label", event.target.value)} /></div>
            <div className="field"><label htmlFor="secondary_cta_href">Link tweede knop</label><input id="secondary_cta_href" name="secondary_cta_href" value={preview.secondary_cta_href} onChange={(event) => update("secondary_cta_href", event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="note">Korte geruststelling</label><input id="note" name="note" value={preview.note} onChange={(event) => update("note", event.target.value)} /></div>
          <div className="field">
            <label htmlFor="hero_image_url">Hero-afbeelding</label>
            <div className="cms-media-input"><ImageIcon aria-hidden="true" /><input id="hero_image_url" name="hero_image_url" list="cms-media-options" value={preview.hero_image_url} onChange={(event) => update("hero_image_url", event.target.value)} /></div>
            <datalist id="cms-media-options">{media.map((item) => <option key={item.public_url} value={item.public_url}>{item.filename}</option>)}</datalist>
            <small>Kies een URL uit de mediabibliotheek. <Link href="/beheer/media">Nieuw beeld uploaden</Link></small>
          </div>
          <div className="field"><label htmlFor="hero_image_alt">Alternatieve tekst</label><input id="hero_image_alt" name="hero_image_alt" value={preview.hero_image_alt} onChange={(event) => update("hero_image_alt", event.target.value)} placeholder="Leeg laten als het beeld alleen decoratief is" /></div>
          <fieldset className="cms-motion-settings">
            <legend><span className="eyebrow">Doorlopende balk</span><strong>Marquee</strong></legend>
            <p>Alleen de woorden zijn aanpasbaar; snelheid en beweging blijven technisch beschermd.</p>
            <div className="cms-two-column">
              <div className="field"><label htmlFor="marquee_primary">Tekst 1</label><input id="marquee_primary" name="marquee_primary" value={preview.marquee_primary} onChange={(event) => update("marquee_primary", event.target.value)} /></div>
              <div className="field"><label htmlFor="marquee_secondary">Tekst 2</label><input id="marquee_secondary" name="marquee_secondary" value={preview.marquee_secondary} onChange={(event) => update("marquee_secondary", event.target.value)} /></div>
            </div>
          </fieldset>
          <fieldset className="cms-motion-settings">
            <legend><span className="eyebrow">Homepage</span><strong>Verhaal en beelden</strong></legend>
            <p>Deze velden sturen de grote inhoudsblokken onder de hero. Afbeeldingen kun je later vervangen via de mediabibliotheek.</p>
            <div className="field"><label htmlFor="mission_eyebrow">Missie — bovenregel</label><input id="mission_eyebrow" name="mission_eyebrow" value={preview.mission_eyebrow} onChange={(event) => update("mission_eyebrow", event.target.value)} /></div>
            <div className="field"><label htmlFor="mission_title">Missie — titel</label><input id="mission_title" name="mission_title" value={preview.mission_title} onChange={(event) => update("mission_title", event.target.value)} /></div>
            <div className="field"><label htmlFor="mission_text">Missie — tekst</label><textarea id="mission_text" name="mission_text" value={preview.mission_text} onChange={(event) => update("mission_text", event.target.value)} /></div>
            <div className="field"><label htmlFor="mission_image_url">Missie — afbeelding</label><input id="mission_image_url" name="mission_image_url" list="cms-media-options" value={preview.mission_image_url} onChange={(event) => update("mission_image_url", event.target.value)} /></div>
            <div className="field"><label htmlFor="faith_eyebrow">Faith &amp; Fitness — bovenregel</label><input id="faith_eyebrow" name="faith_eyebrow" maxLength={80} value={preview.faith_eyebrow} onChange={(event) => update("faith_eyebrow", event.target.value)} /><small>{preview.faith_eyebrow.length}/80 tekens</small></div>
            <div className="field"><label htmlFor="faith_title">Faith &amp; Fitness — titel</label><input id="faith_title" name="faith_title" maxLength={100} value={preview.faith_title} onChange={(event) => update("faith_title", event.target.value)} /><small>{preview.faith_title.length}/100 tekens</small></div>
            <div className="field"><label htmlFor="faith_subtitle">Faith &amp; Fitness — ondertitel</label><input id="faith_subtitle" name="faith_subtitle" maxLength={140} value={preview.faith_subtitle} onChange={(event) => update("faith_subtitle", event.target.value)} /><small>{preview.faith_subtitle.length}/140 tekens</small></div>
            <div className="field"><label htmlFor="faith_text">Faith &amp; Fitness — introductie</label><textarea id="faith_text" name="faith_text" maxLength={420} value={preview.faith_text} onChange={(event) => update("faith_text", event.target.value)} /><small>{preview.faith_text.length}/420 tekens</small></div>
            <div className="field"><label htmlFor="faith_image_url">Faith &amp; Fitness — afbeelding</label><input id="faith_image_url" name="faith_image_url" list="cms-media-options" value={preview.faith_image_url} onChange={(event) => update("faith_image_url", event.target.value)} /></div>
            <input type="hidden" name="faith_story_layout_version" value="2" />
            <input type="hidden" name="faith_story_step_count" value={preview.faith_story_steps.length} />
            <div className="cms-repeat-heading">
              <div>
                <strong>Scrollverhaal</strong>
                <small>{preview.faith_story_steps.length} stappen · minimaal 3, maximaal 12</small>
              </div>
              <button type="button" onClick={addFaithStep} disabled={preview.faith_story_steps.length >= 12}>
                <Plus aria-hidden="true" /> Stap toevoegen
              </button>
            </div>
            <div className="cms-repeat-grid">
              {preview.faith_story_steps.map((step, index) => (
                <fieldset className="cms-repeat-card" key={`faith-${index}`}>
                  <legend>Verhaalstap {index + 1}</legend>
                  <div className="cms-repeat-actions">
                    <button type="button" onClick={() => moveFaithStep(index, -1)} disabled={index === 0} aria-label={`Verhaalstap ${index + 1} omhoog verplaatsen`}><ArrowUp aria-hidden="true" /></button>
                    <button type="button" onClick={() => moveFaithStep(index, 1)} disabled={index === preview.faith_story_steps.length - 1} aria-label={`Verhaalstap ${index + 1} omlaag verplaatsen`}><ArrowDown aria-hidden="true" /></button>
                    <button className="is-danger" type="button" onClick={() => removeFaithStep(index)} disabled={preview.faith_story_steps.length <= 3} aria-label={`Verhaalstap ${index + 1} verwijderen`}><Trash2 aria-hidden="true" /></button>
                  </div>
                  <div className="cms-faith-step-preview" role="img" aria-label={step.image_alt || step.title} style={{ backgroundImage: `linear-gradient(0deg, rgba(8,10,8,.56), transparent), url(${JSON.stringify(step.image_url).slice(1, -1)})` }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step.title}</strong></div>
                  <div className="field"><label htmlFor={`faith_story_${index}_title`}>Korte titel</label><input id={`faith_story_${index}_title`} name={`faith_story_${index}_title`} maxLength={80} value={step.title} onChange={(event) => updateFaithStep(index, "title", event.target.value)} /><small>{step.title.length}/80 tekens</small></div>
                  <div className="field"><label htmlFor={`faith_story_${index}_text`}>Verhaaltekst</label><textarea id={`faith_story_${index}_text`} name={`faith_story_${index}_text`} rows={4} maxLength={420} value={step.text} onChange={(event) => updateFaithStep(index, "text", event.target.value)} /><small>{step.text.length}/420 tekens</small></div>
                  <div className="field"><label htmlFor={`faith_story_${index}_image_url`}>Beeld</label><input id={`faith_story_${index}_image_url`} name={`faith_story_${index}_image_url`} list="cms-media-options" value={step.image_url} onChange={(event) => updateFaithStep(index, "image_url", event.target.value)} /></div>
                  <div className="field"><label htmlFor={`faith_story_${index}_image_alt`}>Beeldbeschrijving</label><input id={`faith_story_${index}_image_alt`} name={`faith_story_${index}_image_alt`} maxLength={240} value={step.image_alt} onChange={(event) => updateFaithStep(index, "image_alt", event.target.value)} /><small>{step.image_alt.length}/240 tekens</small></div>
                </fieldset>
              ))}
            </div>
            {saveState.fieldErrors?.faith_story_steps?.map((error) => <small className="field-error" key={error}>{error}</small>)}
            <div className="cms-two-column"><div className="field"><label htmlFor="omar_eyebrow">Omar — bovenregel</label><input id="omar_eyebrow" name="omar_eyebrow" value={preview.omar_eyebrow} onChange={(event) => update("omar_eyebrow", event.target.value)} /></div><div className="field"><label htmlFor="omar_word">Groot woord</label><input id="omar_word" name="omar_word" value={preview.omar_word} onChange={(event) => update("omar_word", event.target.value)} maxLength={12} /></div></div>
            <div className="field"><label htmlFor="omar_title">Omar — titel</label><input id="omar_title" name="omar_title" value={preview.omar_title} onChange={(event) => update("omar_title", event.target.value)} /></div>
            <div className="field"><label htmlFor="omar_text">Omar — tekst</label><textarea id="omar_text" name="omar_text" value={preview.omar_text} onChange={(event) => update("omar_text", event.target.value)} /></div>
            <div className="field"><label htmlFor="omar_image_url">Omar — afbeelding</label><input id="omar_image_url" name="omar_image_url" list="cms-media-options" value={preview.omar_image_url} onChange={(event) => update("omar_image_url", event.target.value)} /></div>
            <div className="field">
              <label>Community — 15 afbeeldingen</label>
              <div className="cms-image-grid">{preview.community_image_urls.map((url, index) => <label className="cms-image-field" key={`community-${index}`}><span>Positie {index + 1}</span><span className="cms-image-field__preview" style={{ backgroundImage: `url(${JSON.stringify(url).slice(1, -1)})` }} /><input name={`community_image_url_${index}`} list="cms-media-options" value={url} onChange={(event) => update("community_image_urls", preview.community_image_urls.map((current, imageIndex) => imageIndex === index ? event.target.value : current))} /></label>)}</div>
              <small>Kies per positie een beeld. De positie en het aantal tegels liggen vast, zodat de scrollanimatie niet kan breken.</small>
              {saveState.fieldErrors?.community_image_urls?.map((error) => <small className="field-error" key={error}>{error}</small>)}
            </div>
          </fieldset>
          <fieldset className="cms-motion-settings">
            <legend><span className="eyebrow">Onderzijde homepage</span><strong>Reviews en CTA</strong></legend>
            <div className="cms-two-column"><div className="field"><label htmlFor="reviews_eyebrow">Reviews — bovenregel</label><input id="reviews_eyebrow" name="reviews_eyebrow" value={preview.reviews_eyebrow} onChange={(event) => update("reviews_eyebrow", event.target.value)} /></div><div className="field"><label htmlFor="reviews_title">Reviews — titel</label><input id="reviews_title" name="reviews_title" value={preview.reviews_title} onChange={(event) => update("reviews_title", event.target.value)} /></div><div className="field"><label htmlFor="reviews_title_accent">Reviews — groen deel</label><input id="reviews_title_accent" name="reviews_title_accent" value={preview.reviews_title_accent} onChange={(event) => update("reviews_title_accent", event.target.value)} /></div></div>
            <div className="field"><label htmlFor="reviews_intro">Reviews — uitleg</label><textarea id="reviews_intro" name="reviews_intro" value={preview.reviews_intro} onChange={(event) => update("reviews_intro", event.target.value)} /></div>
            <div className="cms-repeat-grid">{preview.review_cards.map((card, index) => <fieldset className="cms-repeat-card" key={`review-${index}`}><legend>Review {index + 1}</legend><div className="field"><label htmlFor={`review_${index}_label`}>Label</label><input id={`review_${index}_label`} name={`review_${index}_label`} value={card.label} onChange={(event) => updateReview(index, "label", event.target.value)} /></div><div className="field"><label htmlFor={`review_${index}_title`}>Titel</label><input id={`review_${index}_title`} name={`review_${index}_title`} value={card.title} onChange={(event) => updateReview(index, "title", event.target.value)} /></div><div className="field"><label htmlFor={`review_${index}_text`}>Tekst</label><textarea id={`review_${index}_text`} name={`review_${index}_text`} rows={3} value={card.text} onChange={(event) => updateReview(index, "text", event.target.value)} /></div></fieldset>)}</div>
            <div className="cms-two-column"><div className="field"><label htmlFor="directions_eyebrow">Richtingen — bovenregel</label><input id="directions_eyebrow" name="directions_eyebrow" value={preview.directions_eyebrow} onChange={(event) => update("directions_eyebrow", event.target.value)} /></div><div className="field"><label htmlFor="directions_title">Richtingen — titel</label><input id="directions_title" name="directions_title" value={preview.directions_title} onChange={(event) => update("directions_title", event.target.value)} /></div><div className="field"><label htmlFor="directions_title_accent">Richtingen — groen deel</label><input id="directions_title_accent" name="directions_title_accent" value={preview.directions_title_accent} onChange={(event) => update("directions_title_accent", event.target.value)} /></div><div className="field"><label htmlFor="final_cta_title">Laatste CTA — titel</label><input id="final_cta_title" name="final_cta_title" value={preview.final_cta_title} onChange={(event) => update("final_cta_title", event.target.value)} /></div><div className="field"><label htmlFor="final_cta_text">Laatste CTA — tekst</label><input id="final_cta_text" name="final_cta_text" value={preview.final_cta_text} onChange={(event) => update("final_cta_text", event.target.value)} /></div></div>
          </fieldset>
          <fieldset className="cms-motion-settings">
            <legend><span className="eyebrow">Beweging</span><strong>Scrollanimaties</strong></legend>
            <p>De effecten spelen één keer af wanneer een bezoeker het onderdeel voor het eerst bereikt. Bezoekers met ‘verminder beweging’ zien altijd een rustige versie.</p>
            <div className="cms-two-column">
              <div className="field"><label htmlFor="motion_hero_accents">Groene woorden in de hero</label><select id="motion_hero_accents" name="motion_hero_accents" value={preview.motion_hero_accents} onChange={(event) => update("motion_hero_accents", event.target.value)}><option value="slide">Inschuiven bij eerste scroll</option><option value="none">Geen animatie</option></select></div>
              <div className="field"><label htmlFor="motion_goal_cards">Doelkaarten</label><select id="motion_goal_cards" name="motion_goal_cards" value={preview.motion_goal_cards} onChange={(event) => update("motion_goal_cards", event.target.value)}><option value="blink">Een voor een oplichten</option><option value="none">Geen animatie</option></select></div>
              <div className="field"><label htmlFor="motion_method_line_1">‘Geen los schema’</label><select id="motion_method_line_1" name="motion_method_line_1" value={preview.motion_method_line_1} onChange={(event) => update("motion_method_line_1", event.target.value)}><option value="typewriter">Typemachine-effect</option><option value="none">Geen animatie</option></select></div>
              <div className="field"><label htmlFor="motion_method_line_2">‘Wel een duidelijke route’</label><select id="motion_method_line_2" name="motion_method_line_2" value={preview.motion_method_line_2} onChange={(event) => update("motion_method_line_2", event.target.value)}><option value="slide_up">Van onder inschuiven</option><option value="none">Geen animatie</option></select></div>
              <div className="field"><label htmlFor="motion_results_accents">Groene woorden op Resultaten</label><select id="motion_results_accents" name="motion_results_accents" value={preview.motion_results_accents} onChange={(event) => update("motion_results_accents", event.target.value)}><option value="slide">Inschuiven bij onderdeel</option><option value="none">Geen animatie</option></select></div>
              <div className="field"><label htmlFor="motion_client_stories">Cliëntverhalen</label><select id="motion_client_stories" name="motion_client_stories" value={preview.motion_client_stories} onChange={(event) => update("motion_client_stories", event.target.value)}><option value="scroll">Scrollindeling animeren</option><option value="none">Geen animatie</option></select></div>
            </div>
          </fieldset>
          <div className="field"><label htmlFor="change_summary">Notitie bij deze versie</label><input id="change_summary" name="change_summary" maxLength={240} placeholder="Bijvoorbeeld: kop scherper gemaakt" /></div>
          {saveState.message ? <p className={`cms-message cms-message--${saveState.status}`} role="status">{saveState.message}</p> : null}
          <button className="button button--outline" type="submit" disabled={saving}><Save aria-hidden="true" size={18} /> {saving ? "Concept opslaan…" : "Concept opslaan"}</button>
        </form>

        <form action={publishAction} className="cms-publish-bar">
          <input type="hidden" name="revision_id" value={publishableRevisionId || ""} />
          <div><strong>{publishableVersion ? `Concept v${publishableVersion} klaar` : "Sla eerst een concept op"}</strong><span>Publiceren vervangt de huidige live versie.</span></div>
          <button className="button button--primary" type="submit" disabled={!canPublish || !publishableRevisionId || publishing}><Send aria-hidden="true" size={18} /> {publishing ? "Publiceren…" : "Nu publiceren"}</button>
        </form>
        {publishState.message ? <p className={`cms-message cms-message--${publishState.status}`} role="status">{publishState.message}</p> : null}
      </section>

      <aside className="cms-preview-column">
        <div className="cms-preview-toolbar"><div><span className="cms-live-dot" /> Live voorbeeld</div><Link href="/" target="_blank">Open website <ExternalLink aria-hidden="true" size={15} /></Link></div>
        <div className="cms-hero-preview">
          <div className="cms-hero-preview__copy">
            <span>{preview.eyebrow}</span>
            <h2>{preview.title_line_1} <em>{preview.title_line_1_accent}</em><br />{preview.title_line_2} <em>{preview.title_line_2_accent}</em></h2>
            <p>{preview.intro}</p>
            <div><strong>{preview.primary_cta_label}</strong><b>{preview.secondary_cta_label}</b></div>
            <small><CheckCircle2 aria-hidden="true" /> {preview.note}</small>
          </div>
          <div className="cms-hero-preview__image" style={{ backgroundImage: `linear-gradient(90deg, #080a08, transparent), url(${JSON.stringify(preview.hero_image_url).slice(1, -1)})` }} />
        </div>
      </aside>
    </div>
  );
}
