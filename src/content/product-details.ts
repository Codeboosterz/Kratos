import type { Product } from "@/src/domain/products";

export const priceRequestHref = (slug: string) => `/intake?source=product-detail&product=${encodeURIComponent(slug)}&intent=price`;
export const canPurchase = (product: Product) => product.priceStatus === "verified" && Boolean(product.priceCents && product.priceUnit && product.stripePriceId && product.checkoutMode === "stripe_internal");
