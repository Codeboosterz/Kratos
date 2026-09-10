import Stripe from "stripe";
import { checkoutSessionSchema } from "@/src/schemas/checkout";
import { getCommerceProduct } from "@/src/server/commerce-catalogue";
import { getProduct } from "@/src/server/catalogue";
import { fixtureMode } from "@/src/server/environment";
import { createFixtureOrder } from "@/src/server/fixture-store";
import { checkDurableRateLimit, requestClientKey } from "@/src/server/rate-limit";
import { getCheckoutConfiguration, matchesCheckoutPrice } from "@/src/server/checkout-configuration";

export async function POST(request: Request) {
  const limit = await checkDurableRateLimit({ namespace: "checkout", key: requestClientKey(request), limit: 8, windowMs: 60_000 }); if (!limit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Probeer het over een minuut opnieuw.", retryable: true } }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  let json: unknown; try { json = await request.json(); } catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldige aanvraag.", retryable: false } }, { status: 400 }); }
  const parsed = checkoutSessionSchema.safeParse(json); if (!parsed.success || request.headers.get("idempotency-key") !== parsed.data?.idempotencyKey) return Response.json({ error: { code: "INVALID_INPUT", message: "Product en idempotentiesleutel zijn vereist.", retryable: false } }, { status: 400 });
  if (fixtureMode) {
    const product = getProduct(parsed.data.productSlug);
    if (!product) return Response.json({ error: { code: "NOT_FOUND", message: "Traject niet gevonden.", retryable: false } }, { status: 404 });
    const order = createFixtureOrder(product.slug, parsed.data.idempotencyKey);
    return Response.json({ demo: true, sessionId: order.sessionId, redirectTo: `/checkout/success?session_id=${encodeURIComponent(order.sessionId)}` });
  }
  const candidate = await getCommerceProduct(parsed.data.productSlug);
  if (!candidate) return Response.json({ error: { code: "NOT_FOUND", message: "Traject niet gevonden.", retryable: false } }, { status: 404 });
  const configuration = await getCheckoutConfiguration(candidate);
  if (!configuration.ready) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Checkout is nog niet geconfigureerd voor dit traject.", retryable: false } }, { status: 503 });
  const { product, secretKey, mode, origin } = configuration;
  if (parsed.data.quote?.priceCents !== product.priceCents || parsed.data.quote?.currency !== product.currency) {
    return Response.json({ error: { code: "PRICE_CHANGED", message: "De prijsinformatie is gewijzigd. Vernieuw deze pagina en controleer het bedrag voordat je verdergaat.", retryable: false } }, { status: 409 });
  }
  try {
    const stripe = new Stripe(secretKey, { timeout: 10_000, maxNetworkRetries: 1 });
    const price = await stripe.prices.retrieve(product.stripePriceId);
    if (!matchesCheckoutPrice(price, product, mode)) {
      return Response.json({ error: { code: "PRICE_CONFIGURATION_REQUIRED", message: "De betaalinstellingen voor dit traject moeten worden gecontroleerd. Er is geen betaling gestart.", retryable: false } }, { status: 503 });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment", ui_mode: "elements", currency: product.currency,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { productId: product.id, productSlug: product.slug },
    }, { idempotencyKey: `checkout:${product.id}:${parsed.data.idempotencyKey}` });
    if (!session.client_secret) throw new Error("Stripe session has no client secret");
    return Response.json({ demo: false, sessionId: session.id, clientSecret: session.client_secret }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: { code: "PROVIDER_FAILURE", message: "De betaalprovider is tijdelijk niet beschikbaar.", retryable: true } }, { status: 502 });
  }
}
