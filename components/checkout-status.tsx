"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CheckoutStatus as Status } from "@/src/schemas/checkout";

const copy: Record<Status, { title: string; body: string }> = {
  processing: { title: "Betaling wordt gecontroleerd", body: "We wachten op een door de server bevestigde status." },
  paid: { title: "Betaling bevestigd", body: "De server heeft de betaling als voltooid bevestigd." },
  unpaid: { title: "Betaling niet voltooid", body: "De sessie is afgerond zonder bevestigde betaling." },
  expired: { title: "Betaalsessie verlopen", body: "Start opnieuw vanuit het gekozen traject." },
  failed: { title: "Controle mislukt", body: "De betaalstatus kon niet veilig worden opgehaald." },
  unknown: { title: "Status onbekend", body: "De URL alleen is geen betalingsbewijs. We konden geen gezaghebbende status vinden." },
};

export function CheckoutStatus({ sessionId }: { sessionId: string | null }) {
  const [status, setStatus] = useState<Status>(sessionId ? "processing" : "unknown");
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" }).then(async (response) => ({ response, payload: await response.json() })).then(({ response, payload }) => {
      if (cancelled) return;
      setStatus(response.ok ? payload.status : "unknown"); setDemo(Boolean(payload.demo));
    }).catch(() => { if (!cancelled) setStatus("failed"); });
    return () => { cancelled = true; };
  }, [sessionId]);
  const current = copy[status];
  return <div className={`checkout-result checkout-result--${status}`} data-testid="checkout-status"><span className="eyebrow">{demo ? "Demonstratiemodus" : "Betaalstatus"}</span><h1 className="section-title">{current.title}</h1><p className="lead">{current.body}</p>{demo ? <p className="fixture-note">Dit is een server-owned fixturestatus en geen echte betaling.</p> : null}<div className="hero__actions"><Link className="button button--primary" href="/intake?source=checkout-success">Plan een intake</Link><Link className="button button--outline" href="/trajecten">Terug naar trajecten</Link></div></div>;
}
