"use client";

import Script from "next/script";
import { CalendarCheck2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement; resize?: boolean }) => void;
    };
  }
}

export function CalendlyEmbed({ url, reference, onScheduled }: { url: string; reference: string; onScheduled?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scheduled, setScheduled] = useState(false);

  function initialize() {
    if (!containerRef.current || !window.Calendly) return;
    containerRef.current.replaceChildren();
    window.Calendly.initInlineWidget({ url, parentElement: containerRef.current, resize: true });
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      let origin: URL;
      try { origin = new URL(event.origin); } catch { return; }
      if (origin.protocol !== "https:" || (origin.hostname !== "calendly.com" && !origin.hostname.endsWith(".calendly.com"))) return;
      if (event.data?.event === "calendly.event_scheduled") {
        setScheduled(true);
        onScheduled?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onScheduled]);

  return (
    <section className="intake-scheduler" aria-labelledby="intake-scheduler-title">
      <div className="intake-scheduler__heading">
        <span><CalendarCheck2 aria-hidden="true" /></span>
        <div>
          <small>Stap 4 · afspraak</small>
          <h2 id="intake-scheduler-title">Kies je datum en tijd.</h2>
          <p>Alleen beschikbare momenten van Omar worden getoond. Je ontvangt de definitieve bevestiging van Calendly.</p>
        </div>
      </div>
      {scheduled ? (
        <div className="intake-scheduler__confirmed" role="status">
          <CalendarCheck2 aria-hidden="true" />
          <div><strong>Je intakegesprek staat gepland.</strong><span>Referentie {reference}. Controleer je e-mail voor de bevestiging en opties om te verplaatsen of annuleren.</span></div>
        </div>
      ) : null}
      <div className="calendly-inline-widget" ref={containerRef} data-url={url} />
      <p className="intake-scheduler__privacy"><ShieldCheck aria-hidden="true" /> Calendly verwerkt de planning. Kratos bewaart alleen de afspraakgegevens die nodig zijn voor opvolging.</p>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" onLoad={initialize} onReady={initialize} />
    </section>
  );
}
