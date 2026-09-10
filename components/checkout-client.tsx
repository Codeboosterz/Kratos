"use client";

import { CheckoutElementsProvider, ContactDetailsElement, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js/pure";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type SessionPayload = { demo: true; sessionId: string; redirectTo: string } | { demo: false; sessionId: string; clientSecret: string };
type CheckoutQuote = { priceCents: number; currency: string };

export function StripePaymentForm({ sessionId, quote }: { sessionId: string; quote: CheckoutQuote }) {
  const state = useCheckoutElements();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const confirming = useRef(false);
  const matchesQuote = state.type === "success" &&
    state.checkout.total.total.minorUnitsAmount === quote.priceCents && state.checkout.currency === quote.currency;

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.type !== "success" || !state.checkout.canConfirm || !matchesQuote || confirming.current) return;
    confirming.current = true;
    setPending(true);
    setMessage("");
    try {
      const result = await state.checkout.confirm({
        returnUrl: `${window.location.origin}/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
      });
      if (result.type === "error") setMessage(result.error.message || "De betaling kon niet worden bevestigd.");
    } catch {
      setMessage("De bevestiging kon niet worden opgehaald. Probeer opnieuw binnen deze betaalsessie.");
    } finally {
      confirming.current = false;
      setPending(false);
    }
  }

  if (state.type === "loading") return <p role="status">Beveiligd betaalformulier laden…</p>;
  if (state.type === "error") return <p className="error-summary" role="alert">Het betaalformulier kon niet worden geladen. Vernieuw de pagina of probeer het later opnieuw.</p>;
  if (!matchesQuote) return <p className="error-summary" role="alert">Het betaalbedrag wijkt af van het gekozen traject. Vernieuw de pagina en controleer de prijs voordat je verdergaat.</p>;

  return (
    <form className="payment-element-shell" onSubmit={confirm} aria-label="Veilig betalen">
      <ContactDetailsElement />
      <PaymentElement />
      <p>Totaal: <strong>{state.checkout.total.total.amount}</strong></p>
      {message ? <p className="error-summary" role="alert">{message}</p> : null}
      <button className="button button--primary" type="submit" disabled={pending || !state.checkout.canConfirm}>{pending ? "Bevestigen…" : `Betaal ${state.checkout.total.total.amount}`}</button>
    </form>
  );
}

export function CheckoutClient({ productSlug, publishableKey, fixture, quote }: { productSlug: string; publishableKey: string | null; fixture: boolean; quote: CheckoutQuote | null }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const starting = useRef(false);
  const attemptKey = useRef<string | null>(null);
  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey]);

  async function start() {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    setError("");
    try {
      // Keep the key across uncertain network failures; Stripe reuses the session.
      const idempotencyKey = attemptKey.current ??= crypto.randomUUID();
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ productSlug, idempotencyKey, quote }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Checkout is niet beschikbaar.");
      if (payload.demo === true && fixture && /^demo_cs_[a-f0-9]{18}$/.test(payload.sessionId)) {
        router.push(`/checkout/success?session_id=${encodeURIComponent(payload.sessionId)}`);
      } else if (payload.demo === false && typeof payload.clientSecret === "string" && /^cs_(live|test)_[A-Za-z0-9_]+$/.test(payload.sessionId)) {
        setSession(payload);
      } else {
        throw new Error("De betaalsessie kon niet worden gecontroleerd. Probeer het later opnieuw.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout is niet beschikbaar.");
    } finally {
      starting.current = false;
      setPending(false);
    }
  }

  if (session && !session.demo && stripePromise && quote) {
    return <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret: session.clientSecret, elementsOptions: { appearance: { theme: "night", variables: { colorPrimary: "#a9cf68", colorBackground: "#121510", colorText: "#f4f6ef", borderRadius: "12px" } } } }}><StripePaymentForm sessionId={session.sessionId} quote={quote} /></CheckoutElementsProvider>;
  }

  return <div><button className="button button--primary" type="button" onClick={start} disabled={pending} data-testid="open-checkout">{pending ? "Sessie voorbereiden…" : fixture ? "Start veilige demo" : "Veilig betalen"}</button>{error ? <p className="error-summary" role="alert">{error}</p> : null}</div>;
}
