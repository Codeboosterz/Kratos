import "server-only";
import type { Product } from "@/src/domain/products";
import { checkoutRoute } from "@/src/domain/routes";

export type StartAction = { kind: "checkout"; label: "Bekijk checkout"; href: string };

// Navigation is always available. Only the checkout server may authorize a sale.
export async function resolveStartAction(product: Product): Promise<StartAction> {
  return { kind: "checkout", label: "Bekijk checkout", href: checkoutRoute(product.slug) };
}
