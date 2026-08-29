import "server-only";
import type { Product } from "@/src/domain/products";
import { connectorEnvironment } from "@/src/server/environment";
import { getVerifiedTrainerizeUrl } from "@/src/server/trainerize";

export type StartAction =
  | { kind: "trainerize"; label: "Bekijk programma"; href: string }
  | { kind: "checkout"; label: "Veilig betalen"; href: string }
  | { kind: "disabled"; label: "Nog niet beschikbaar"; reason: string };

export function resolveStartAction(product: Product): StartAction {
  if (product.checkoutMode === "trainerize_external" && product.trainerizePlanId) {
    const href = getVerifiedTrainerizeUrl(product.trainerizePlanId);
    if (href) return { kind: "trainerize", label: "Bekijk programma", href };
  }

  if (
    product.checkoutMode === "stripe_internal" &&
    product.priceStatus === "verified" &&
    product.priceCents &&
    product.stripePriceId &&
    connectorEnvironment.stripeSecretConfigured
  ) {
    return { kind: "checkout", label: "Veilig betalen", href: `/checkout/${product.slug}` };
  }

  return {
    kind: "disabled",
    label: "Nog niet beschikbaar",
    reason: "Prijs en startbestemming worden nog bevestigd. Plan een intake om je opties te bespreken.",
  };
}
