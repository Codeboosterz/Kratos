import Stripe from "stripe";
import { checkoutSessionSchema } from "@/src/schemas/checkout";
import { getCommerceProduct } from "@/src/server/commerce-catalogue";
import { getProduct } from "@/src/server/catalogue";
import { fixtureMode, trustedSiteOrigin } from "@/src/server/environment";
import { createFixtureOrder } from "@/src/server/fixture-store";
import { checkDurableRateLimit, requestClientKey } from "@/src/server/rate-limit";
import { resolveIntegrationSecret } from "@/src/operations/secrets";

export async function POST(request: Request) {
  const limit = await checkDurableRateLimit({ namespace: "checkout", key: requestClientKey(request), limit: 8, windowMs: 60_000 }); if (!limit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Probeer het over een minuut opnieuw.", retryable: true } }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  let json: unknown; try { json = await request.json(); } catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldige aanvraag.", retryable: false } }, { status: 400 }); }
  const parsed = checkoutSessionSchema.safeParse(json); if (!parsed.success || request.headers.get("idempotency-key") !== parsed.data?.idempotencyKey) return Response.json({ error: { code: "INVALID_INPUT", message: "Product en idempotentiesleutel zijn vereist.", retryable: false } }, { status: 400 });
  const product = fixtureMode ? getProduct(parsed.data.productSlug) : await getCommerceProduct(parsed.data.productSlug); if (!product || !product.active) return Response.json({ error: { code: "NOT_FOUND", message: "Traject niet gevonden.", retryable: false } }, { status: 404 });
  if (fixtureMode) { const order = createFixtureOrder(product.slug, parsed.data.idempotencyKey); return Response.json({ demo: true, sessionId: order.sessionId, redirectTo: `/checkout/success?session_id=${encodeURIComponent(order.sessionId)}` }); }
  const secretKey = await resolveIntegrationSecret("stripe", "secret_key").catch(() => null);
  if (!product.priceCents || !product.stripePriceId || !secretKey || !trustedSiteOrigin) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Checkout is nog niet geconfigureerd voor dit traject.", retryable: false } }, { status: 503 });
  try { const stripe = new Stripe(secretKey); const session = await stripe.checkout.sessions.create({ mode: "payment", ui_mode: "elements", line_items: [{ price: product.stripePriceId, quantity: 1 }], return_url: `${trustedSiteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, metadata: { productId: product.id, productSlug: product.slug } }, { idempotencyKey: parsed.data.idempotencyKey }); if (!session.client_secret) throw new Error("Stripe session has no client secret"); return Response.json({ demo: false, sessionId: session.id, clientSecret: session.client_secret }); } catch { return Response.json({ error: { code: "PROVIDER_FAILURE", message: "De betaalprovider is tijdelijk niet beschikbaar.", retryable: true } }, { status: 502 }); }
}
