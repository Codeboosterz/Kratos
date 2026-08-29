import "server-only";

import { getProduct } from "@/src/server/catalogue";
import { createAdminClient } from "@/src/supabase/admin";

export type CommerceProduct = {
  id: string; slug: string; name: string; summary: string; priceCents: number | null; currency: string;
  stripePriceId: string | null; active: boolean;
};

export async function getCommerceProduct(slug: string): Promise<CommerceProduct | null> {
  if (process.env.SUPABASE_SECRET_KEY?.trim()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from("cms_products").select("id, slug, name, description, status, price_cents, currency, stripe_price_id").eq("slug", slug).maybeSingle();
      if (!error && data) return {
        id: data.id, slug: data.slug, name: data.name, summary: data.description, priceCents: data.price_cents,
        currency: data.currency, stripePriceId: data.stripe_price_id, active: data.status === "active",
      };
    } catch {
      // The static catalogue remains a safe, non-commercial fallback before migration.
    }
  }
  const fallback = getProduct(slug);
  if (!fallback) return null;
  return {
    id: fallback.id, slug: fallback.slug, name: fallback.name, summary: fallback.summary, priceCents: fallback.priceCents,
    currency: "eur", stripePriceId: fallback.stripePriceId, active: fallback.checkoutMode === "stripe_internal" && fallback.priceStatus === "verified",
  };
}
