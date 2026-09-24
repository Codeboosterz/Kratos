import "server-only";
import type { Product } from "@/src/domain/products";
import { checkoutRoute } from "@/src/domain/routes";
import { canPurchase, priceRequestHref } from "@/src/content/product-details";

export type StartAction = { kind: "checkout" | "request"; label: string; href: string };

export async function resolveStartAction(product: Product): Promise<StartAction> {
  if (canPurchase(product)) {
    return { kind: "checkout", label: "Bekijk checkout", href: checkoutRoute(product.slug) };
  }
  return { kind: "request", label: "Vraag prijs en trajectinformatie aan", href: priceRequestHref(product.slug) };
}
