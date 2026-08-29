"use client";

import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js/pure";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SessionPayload = { demo: true; sessionId: string; redirectTo: string } | { demo: false; sessionId: string; clientSecret: string };

function StripePaymentForm({ sessionId }: { sessionId: string }) {
  const state = useCheckoutElements();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (state.type !== "success") return;
    setPending(true);
    setMessage("");
    const result = await state.checkout.confirm({
      returnUrl: `${window.location.origin}/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
    });
    if (result.type === "error") setMessage(result.error.message || "De betaling kon niet worden bevestigd.");
    setPending(false);
  }

  return (
    <div className="payment-element-shell">
      <PaymentElement />
      {message ? <p className="error-summary" role="alert">{message}</p> : null}
      <button className="button button--primary" type="button" disabled={pending || state.type !== "success"} onClick={confirm}>{pending ? "Bevestigen…" : "Betaling bevestigen"}</button>
    </div>
  );
}

export function CheckoutClient({ productSlug, publishableKey, fixture }: { productSlug: string; publishableKey: string | null; fixture: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);

  async function start() {
    setPending(true); setError("");
    const idempotencyKey = crypto.randomUUID();
    try {
      const response = await fetch("/api/checkout/session", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({ productSlug, idempotencyKey }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Checkout is niet beschikbaar.");
      if (payload.demo) router.push(payload.redirectTo);
      else setSession(payload);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Checkout is niet beschikbaar."); }
    finally { setPending(false); }
  }

  if (session && !session.demo && stripePromise) {
    return <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret: session.clientSecret, elementsOptions: { appearance: { theme: "night", variables: { colorPrimary: "#a9cf68", colorBackground: "#121510", colorText: "#f4f6ef", borderRadius: "12px" } } } }}><StripePaymentForm sessionId={session.sessionId} /></CheckoutElementsProvider>;
  }

  return <div><button className="button button--primary" type="button" onClick={start} disabled={pending} data-testid="open-checkout">{pending ? "Sessie voorbereiden…" : fixture ? "Start veilige demo" : "Veilig betalen"}</button>{error ? <p className="error-summary" role="alert">{error}</p> : null}</div>;
}
