"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, Check, CheckCircle2, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendlyEmbed } from "@/components/calendly-embed";
import { goalLabels, type GoalKey } from "@/src/domain/products";
import {
  intakeDraftStorageSchema,
  intakeSchema,
  intakeStepOneSchema,
  intakeStepThreeSchema,
  intakeStepTwoSchema,
  type IntakeInput,
} from "@/src/schemas/intake";

type IntakeDraft = Omit<IntakeInput, "consent" | "goal" | "experience" | "format"> & {
  goal: GoalKey | "";
  experience: "beginner" | "gemiddeld" | "ervaren" | "";
  format: "personal_training" | "online" | "duo" | "home_workout" | "nog_onbekend" | "";
  consent: boolean;
};

type IntakePageContent = Record<string, string>;

const steps = [
  { number: 1, label: "Doel" },
  { number: 2, label: "Voorkeuren" },
  { number: 3, label: "Contact" },
  { number: 4, label: "Afspraak" },
] as const;

const initialDraft = (product: string | null, source: IntakeInput["source"]): IntakeDraft => ({
  goal: "",
  experience: "",
  format: "",
  availability: "",
  note: "",
  name: "",
  email: "",
  phone: "",
  contactChannel: "email",
  consent: false,
  consentVersion: "2026-08-draft-1",
  product,
  source,
  idempotencyKey: crypto.randomUUID(),
});

function issueMap(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[String(issue.path[0] ?? "form")] = issue.message;
  return result;
}

function storageKey(product: string | null, source: IntakeInput["source"]) {
  return `kratos:intake:v2:${product ?? "general"}:${source ?? "direct"}`;
}

export function IntakeForm({
  product,
  source,
  content,
}: {
  product: string | null;
  source: IntakeInput["source"];
  content: IntakePageContent;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IntakeDraft>(() => initialDraft(product, source));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "stored" | "failure">("idle");
  const [message, setMessage] = useState("");
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);
  const draftKey = useMemo(() => storageKey(product, source), [product, source]);
  const stepSchema = useMemo(() => step === 1 ? intakeStepOneSchema : step === 2 ? intakeStepTwoSchema : intakeStepThreeSchema, [step]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = sessionStorage.getItem(draftKey);
        if (saved) {
          const parsed = intakeDraftStorageSchema.safeParse(JSON.parse(saved));
          if (parsed.success) {
            setStep(parsed.data.step);
            setDraft((current) => ({ ...current, ...parsed.data.draft, note: "", consent: false }));
          }
        }
      } catch { /* A corrupt or unavailable session store should never block the form. */ }
      setHydrated(true);
    });
    return () => { active = false; };
  }, [draftKey]);

  useEffect(() => {
    if (!hydrated || status === "stored") return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        step: Math.min(step, 3),
        draft: {
          goal: draft.goal,
          experience: draft.experience,
          format: draft.format,
          availability: draft.availability,
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          contactChannel: draft.contactChannel,
          consentVersion: draft.consentVersion,
          product: draft.product,
          source: draft.source,
          idempotencyKey: draft.idempotencyKey,
        },
      }));
    } catch { /* Draft recovery is progressive enhancement. */ }
  }, [draft, draftKey, hydrated, status, step]);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasMounted.current) { hasMounted.current = true; return; }
    headingRef.current?.focus({ preventScroll: true });
  }, [hydrated, step]);

  function update<K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function validateField(key: keyof IntakeDraft) {
    const parsed = stepSchema.safeParse(draft);
    if (parsed.success) {
      setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
      return;
    }
    const issue = parsed.error.issues.find((item) => item.path[0] === key);
    setErrors((current) => {
      const next = { ...current };
      if (issue) next[String(key)] = issue.message;
      else delete next[String(key)];
      return next;
    });
  }

  function validateStep() {
    const parsed = stepSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(issueMap(parsed.error));
      queueMicrotask(() => errorRef.current?.focus());
      return false;
    }
    setErrors({});
    return true;
  }

  function moveTo(nextStep: number) {
    setErrors({});
    setMessage("");
    setStep(Math.max(1, Math.min(nextStep, 4)));
  }

  function next() {
    if (validateStep()) moveTo(step + 1);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "submitting" || !validateStep()) return;
    const parsed = intakeSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(issueMap(parsed.error));
      queueMicrotask(() => errorRef.current?.focus());
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": draft.idempotencyKey },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json() as { ok?: boolean; reference?: string; schedulingUrl?: string | null; demo?: boolean; error?: { message?: string; fieldErrors?: Record<string, string[]> } };
      if (!response.ok || !payload.ok) {
        const fieldErrors = payload.error?.fieldErrors ?? {};
        setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, values]) => [key, values[0] ?? "Controleer dit veld."])));
        setMessage(payload.error?.message ?? "De intake kon niet worden verstuurd. Probeer opnieuw.");
        setStatus("failure");
        queueMicrotask(() => errorRef.current?.focus());
        return;
      }
      setReference(payload.reference ?? null);
      setSchedulingUrl(payload.schedulingUrl ?? null);
      setIsDemo(Boolean(payload.demo));
      setMessage(payload.schedulingUrl
        ? `Je intake is veilig opgeslagen onder referentie ${payload.reference}. Kies nu een beschikbaar moment.`
        : `Je intake is ontvangen onder referentie ${payload.reference}. De agenda is nog niet gekoppeld; we nemen persoonlijk contact met je op.`);
      setStatus("stored");
      setStep(4);
      try { sessionStorage.removeItem(draftKey); } catch { /* Submission remains authoritative. */ }
    } catch {
      setMessage("De verbinding viel weg. Je antwoorden staan nog klaar; probeer opnieuw.");
      setStatus("failure");
      queueMicrotask(() => errorRef.current?.focus());
    }
  }

  const currentStepLabel = steps.find((item) => item.number === step)?.label ?? "Afspraak";
  const heroIntro = content.hero_intro === "In drie stappen verzamelen we wat nodig is om een passend eerste gesprek voor te bereiden."
    ? "In vier overzichtelijke stappen bereiden we een passend eerste gesprek én je afspraak voor."
    : content.hero_intro;
  const statusText = content.status_text === "Je aanvraag wordt gevalideerd en doorgestuurd zodra een goedgekeurde bestemming is ingesteld. Een verstuurde intake is geen bevestigde afspraak."
    ? "Na stap 3 slaan we je intake veilig op. In stap 4 kies je een datum zodra Calendly is gekoppeld; zonder koppeling neemt Kratos persoonlijk contact op."
    : content.status_text;

  return (
    <div className="form-layout intake-flow" data-step={step}>
      <aside className="form-aside">
        <span className="eyebrow-pill">{content.hero_eyebrow}</span>
        <h1 className="section-title">{content.hero_title} <span className="lime">{content.hero_accent}</span></h1>
        <p className="lead">{heroIntro}</p>
        <ol aria-label="Voortgang">
          {steps.map((item) => {
            const complete = bookingConfirmed ? item.number <= 4 : item.number < step;
            const active = !bookingConfirmed && item.number === step;
            return (
              <li key={item.number} data-active={active || undefined} data-complete={complete || undefined} aria-current={active ? "step" : undefined}>
                <span aria-hidden="true">{complete ? <Check size={18} /> : item.number}</span>
                <em>{item.label}</em>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="intake-flow__main">
        <div className="intake-progress-summary" aria-live="polite">
          <span>Stap {step} van 4</span>
          <strong>{bookingConfirmed ? "Afspraak bevestigd" : currentStepLabel}</strong>
          <i><b style={{ width: `${bookingConfirmed ? 100 : step * 25}%` }} /></i>
        </div>

        {status === "stored" ? (
          <div className="intake-complete">
            {schedulingUrl && reference ? (
              <>
                <div className="status-panel status-panel--success intake-stored-note" role="status">
                  <ShieldCheck className="lime" size={28} aria-hidden="true" />
                  <div><strong>Intake veilig opgeslagen</strong><p>{message}</p></div>
                </div>
                <CalendlyEmbed url={schedulingUrl} reference={reference} onScheduled={() => setBookingConfirmed(true)} />
              </>
            ) : (
              <section className="form-card intake-scheduling-fallback" aria-labelledby="intake-fallback-title">
                <span className="intake-scheduling-fallback__icon"><CalendarClock aria-hidden="true" /></span>
                <div>
                  <small>Stap 4 · afspraak</small>
                  <h2 id="intake-fallback-title" ref={headingRef} tabIndex={-1}>Intake ontvangen</h2>
                  <p>{message}</p>
                </div>
                {isDemo ? <div className="intake-demo-boundary" role="note"><TriangleAlert aria-hidden="true" /><span><strong>Lokale demo — niet zichtbaar in het live CMS</strong><small>Deze testaanvraag blijft alleen in de lokale fixtureomgeving en maakt geen echte afspraak aan.</small></span></div> : null}
                <div className="intake-reference"><CheckCircle2 aria-hidden="true" /><span><strong>Aanvraag opgeslagen</strong><small>{reference}</small></span></div>
                <p className="muted">Zodra de Calendly-koppeling actief is, kan hier direct een datum en tijd worden gekozen. Tot die tijd volgt Kratos je aanvraag persoonlijk op.</p>
                <Link className="button button--outline" href="/trajecten">Bekijk de trajecten</Link>
              </section>
            )}
          </div>
        ) : (
          <>
            <p className="eyebrow">Stap voor stap</p>
            <form className="form-card intake-step-panel" onSubmit={submit} noValidate>
              {(Object.keys(errors).length > 0 || status === "failure") ? (
                <div className="error-summary" role="alert" tabIndex={-1} ref={errorRef}>
                  <strong>Controleer je gegevens</strong>
                  {message ? <p>{message}</p> : <p>Vul de gemarkeerde velden aan.</p>}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="intake-step-content">
                  <div className="intake-step-heading"><span>01</span><h2 ref={headingRef} tabIndex={-1}>Waar wil je naartoe?</h2><p>Kies het doel dat nu het belangrijkst voor je is.</p></div>
                  <fieldset>
                    <legend>Wat is je belangrijkste doel?</legend>
                    <div className="choice-grid">
                      {(Object.keys(goalLabels) as GoalKey[]).map((value) => (
                        <label className="choice-card" key={value}><input type="radio" name="goal" value={value} checked={draft.goal === value} onChange={() => update("goal", value)} />{goalLabels[value]}</label>
                      ))}
                    </div>
                    {errors.goal ? <p className="field-error" role="alert">{errors.goal}</p> : null}
                  </fieldset>
                  <fieldset>
                    <legend>Wat is je ervaringsniveau?</legend>
                    <div className="choice-grid choice-grid--three">
                      {(["beginner", "gemiddeld", "ervaren"] as const).map((value) => (
                        <label className="choice-card" key={value}><input type="radio" name="experience" value={value} checked={draft.experience === value} onChange={() => update("experience", value)} />{value[0].toUpperCase() + value.slice(1)}</label>
                      ))}
                    </div>
                    {errors.experience ? <p className="field-error" role="alert">{errors.experience}</p> : null}
                  </fieldset>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="intake-step-content">
                  <div className="intake-step-heading"><span>02</span><h2 ref={headingRef} tabIndex={-1}>Wat past bij jouw ritme?</h2><p>Zo bereiden we een eerste gesprek voor dat werkelijk aansluit.</p></div>
                  <fieldset>
                    <legend>Welke vorm spreekt je het meest aan?</legend>
                    <div className="choice-grid">
                      {([
                        ["personal_training", "Personal training"], ["online", "Online coaching"], ["duo", "Duo coaching"], ["home_workout", "Thuisprogramma"], ["nog_onbekend", "Nog niet zeker"],
                      ] as const).map(([value, label]) => (
                        <label className="choice-card" key={value}><input type="radio" name="format" value={value} checked={draft.format === value} onChange={() => update("format", value)} />{label}</label>
                      ))}
                    </div>
                    {errors.format ? <p className="field-error" role="alert">{errors.format}</p> : null}
                  </fieldset>
                  <div className="field"><label htmlFor="availability">Wanneer kun je meestal trainen?</label><input id="availability" value={draft.availability} onChange={(event) => update("availability", event.target.value)} onBlur={() => validateField("availability")} aria-invalid={Boolean(errors.availability)} aria-describedby={errors.availability ? "availability-error" : "availability-help"} /><small id="availability-help" className="field-help">Bijvoorbeeld: maandag- en woensdagavond.</small>{errors.availability ? <span id="availability-error" className="field-error" role="alert">{errors.availability}</span> : null}</div>
                  <div className="field"><label htmlFor="note">Wat wil je nog meegeven? <span className="muted">(optioneel)</span></label><textarea id="note" value={draft.note} onChange={(event) => update("note", event.target.value)} onBlur={() => validateField("note")} aria-invalid={Boolean(errors.note)} /><small className="field-help">Deze vrije tekst wordt bewust niet in je tijdelijke browserconcept bewaard.</small>{errors.note ? <span className="field-error" role="alert">{errors.note}</span> : null}</div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="intake-step-content">
                  <div className="intake-step-heading"><span>03</span><h2 ref={headingRef} tabIndex={-1}>Hoe bereiken we je?</h2><p>Na deze stap wordt je intake veilig opgeslagen. Daarna volgt de afspraak.</p></div>
                  <div className="field-grid">
                    <div className="field"><label htmlFor="name">Naam</label><input id="name" autoComplete="name" value={draft.name} onChange={(event) => update("name", event.target.value)} onBlur={() => validateField("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name ? <span id="name-error" className="field-error" role="alert">{errors.name}</span> : null}</div>
                    <div className="field"><label htmlFor="email">E-mailadres</label><input id="email" type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(event) => update("email", event.target.value)} onBlur={() => validateField("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email ? <span id="email-error" className="field-error" role="alert">{errors.email}</span> : null}</div>
                  </div>
                  <div className="field-grid">
                    <div className="field"><label htmlFor="phone">Telefoonnummer <span className="muted">(optioneel)</span></label><input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} onBlur={() => validateField("phone")} /></div>
                    <div className="field"><label htmlFor="contactChannel">Voorkeur voor contact</label><select id="contactChannel" value={draft.contactChannel} onChange={(event) => update("contactChannel", event.target.value as IntakeDraft["contactChannel"])}><option value="email">E-mail</option><option value="telefoon">Telefoon</option></select></div>
                  </div>
                  <label className="consent-row"><input type="checkbox" checked={draft.consent} onChange={(event) => update("consent", event.target.checked)} /><span>Ik geef toestemming om contact met mij op te nemen over deze intake. Lees hoe we gegevens gebruiken in het <Link className="lime" href="/privacy">privacybeleid</Link>.</span></label>
                  {errors.consent ? <p className="field-error" role="alert">{errors.consent}</p> : null}
                </div>
              ) : null}

              <div className="form-actions">
                {step > 1 ? <button className="button button--outline" type="button" onClick={() => moveTo(step - 1)}><ArrowLeft aria-hidden="true" size={18} /> Terug</button> : <Link className="button button--text" href="/trajecten"><ArrowLeft aria-hidden="true" size={18} /> Terug</Link>}
                {step < 3 ? <button className="button button--primary" type="button" onClick={next}>Volgende stap <ArrowRight aria-hidden="true" size={18} /></button> : <button className="button button--primary" type="submit" disabled={status === "submitting"} data-testid="submit-intake">{status === "submitting" ? <><LoaderCircle className="spin" aria-hidden="true" size={18} /> Opslaan</> : <>Ga door naar datum & tijd <ArrowRight aria-hidden="true" size={18} /></>}</button>}
              </div>
            </form>
            <div className="status-panel intake-next-note"><strong>{content.status_title}</strong><p className="muted">{statusText}</p></div>
          </>
        )}
      </div>
    </div>
  );
}
