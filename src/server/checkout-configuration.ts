import "server-only";

import type Stripe from "stripe";
import type { CommerceProduct } from "@/src/server/commerce-catalogue";
import { trustedSiteOrigin } from "@/src/server/environment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { getStripeReadiness } from "@/src/operations/stripe-configuration";
import { productCheckoutBlockers, type CheckoutReason } from "@/src/operations/checkout-readiness";
import { logOperationalEvent } from "@/src/observability/server";

type PricedProduct = CommerceProduct & { priceCents: number; stripePriceId: string };
type CheckoutConfiguration = { ready: false; reasons: CheckoutReason[] } | {
  ready: true;
  product: PricedProduct;
  secretKey: string;
  publishableKey: string;
  mode: "live" | "test";
  origin: string;
};

// Server-only: never pass this object wholesale to a client component.
export async function getCheckoutConfiguration(product: CommerceProduct | null): Promise<CheckoutConfiguration> {
  const blocked = (reasons: CheckoutReason[]): CheckoutConfiguration => {
    logOperationalEvent({ event: "checkout_configuration", route: "/checkout/[slug]", code: reasons[0] });
    return { ready: false, reasons };
  };
  const reasons = productCheckoutBlockers(product);
  if (!trustedSiteOrigin) reasons.push("SITE_ORIGIN_MISSING");
  if (reasons.length) return blocked(reasons);
  if (!product || product.priceCents === null || !product.stripePriceId || !trustedSiteOrigin) return blocked(["PRODUCT_MISSING"]);

  let secretReadFailed = false;
  const readSecret = (slot: string) => resolveIntegrationSecret("stripe", slot).catch(() => { secretReadFailed = true; return null; });
  const [secretKey, publishableKey, webhookSecret] = await Promise.all([
    readSecret("secret_key"), readSecret("publishable_key"), readSecret("webhook_secret"),
  ]);
  if (secretReadFailed) return blocked(["SECRET_READ_FAILED"]);
  const { ready, mode } = getStripeReadiness({ secretKey, publishableKey, webhookSecret });
  if (!ready || !mode || !secretKey || !publishableKey) return blocked(["STRIPE_CONFIGURATION_REQUIRED"]);
  if (process.env.NODE_ENV === "production" && mode !== "live") return blocked(["LIVE_MODE_REQUIRED"]);
  if (mode === "live" && !trustedSiteOrigin.startsWith("https://")) return blocked(["HTTPS_REQUIRED"]);
  return {
    ready: true, product: { ...product, priceCents: product.priceCents, stripePriceId: product.stripePriceId },
    secretKey, publishableKey, mode, origin: trustedSiteOrigin,
  };
}

type CheckoutPrice = Pick<Stripe.Price, "id" | "active" | "type" | "currency" | "unit_amount" | "unit_amount_decimal" | "livemode" | "billing_scheme" | "recurring" | "transform_quantity" | "custom_unit_amount">;

export function matchesCheckoutPrice(price: CheckoutPrice, product: PricedProduct, mode: "test" | "live") {
  return price.id === product.stripePriceId && price.active && price.type === "one_time" &&
    price.currency === product.currency && price.unit_amount === product.priceCents &&
    Number(price.unit_amount_decimal) === product.priceCents && price.livemode === (mode === "live") &&
    price.billing_scheme === "per_unit" && !price.recurring && !price.transform_quantity && !price.custom_unit_amount;
}
