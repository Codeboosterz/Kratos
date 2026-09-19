export const checkoutReasonLabels = {
  PRODUCT_MISSING: "Product ontbreekt in de catalogus",
  PRODUCT_INACTIVE: "Product staat niet actief",
  PRICE_MISSING: "Goedgekeurde prijs ontbreekt of is ongeldig",
  STRIPE_PRICE_MISSING: "Stripe price ID ontbreekt of is ongeldig",
  CURRENCY_INVALID: "Valuta is ongeldig",
  SITE_ORIGIN_MISSING: "Canonieke website-URL ontbreekt",
  STRIPE_CONFIGURATION_REQUIRED: "Stripe-sleutels/webhook ontbreken, zijn ongeldig of gebruiken verschillende modi",
  SECRET_READ_FAILED: "Stripe-configuratie kon niet worden gelezen",
  LIVE_MODE_REQUIRED: "Productie vereist Stripe live-modus",
  HTTPS_REQUIRED: "Live checkout vereist een HTTPS-website-URL",
} as const;
export type CheckoutReason = keyof typeof checkoutReasonLabels;

export function productCheckoutBlockers(product: { active: boolean; priceCents: number | null; stripePriceId: string | null; currency: string } | null): CheckoutReason[] {
  if (!product) return ["PRODUCT_MISSING"];
  const reasons: CheckoutReason[] = [];
  if (!product.active) reasons.push("PRODUCT_INACTIVE");
  if (!Number.isSafeInteger(product.priceCents) || !product.priceCents || product.priceCents < 0) reasons.push("PRICE_MISSING");
  if (!product.stripePriceId?.startsWith("price_")) reasons.push("STRIPE_PRICE_MISSING");
  if (!/^[a-z]{3}$/.test(product.currency)) reasons.push("CURRENCY_INVALID");
  return reasons;
}
