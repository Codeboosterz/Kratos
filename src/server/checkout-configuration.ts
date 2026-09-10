import "server-only";

import type Stripe from "stripe";
import type { CommerceProduct } from "@/src/server/commerce-catalogue";
import { trustedSiteOrigin } from "@/src/server/environment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { getStripeReadiness } from "@/src/operations/stripe-configuration";

type PricedProduct = CommerceProduct & { priceCents: number; stripePriceId: string };
type CheckoutConfiguration = { ready: false } | {
  ready: true;
  product: PricedProduct;
  secretKey: string;
  publishableKey: string;
  mode: "live" | "test";
  origin: string;
};

// Server-only: never pass this object wholesale to a client component.
export async function getCheckoutConfiguration(product: CommerceProduct | null): Promise<CheckoutConfiguration> {
  if (!product?.active || !Number.isSafeInteger(product.priceCents) || !product.priceCents || product.priceCents < 0 ||
      !product.stripePriceId?.startsWith("price_") || !/^[a-z]{3}$/.test(product.currency) || !trustedSiteOrigin) return { ready: false };

  const [secretKey, publishableKey, webhookSecret] = await Promise.all([
    resolveIntegrationSecret("stripe", "secret_key").catch(() => null),
    resolveIntegrationSecret("stripe", "publishable_key").catch(() => null),
    resolveIntegrationSecret("stripe", "webhook_secret").catch(() => null),
  ]);
  const { ready, mode } = getStripeReadiness({ secretKey, publishableKey, webhookSecret });
  if (!ready || !mode || !secretKey || !publishableKey) return { ready: false };
  if (process.env.NODE_ENV === "production" && mode !== "live") return { ready: false };
  if (mode === "live" && !trustedSiteOrigin.startsWith("https://")) return { ready: false };
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
