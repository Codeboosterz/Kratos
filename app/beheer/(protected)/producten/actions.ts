"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCmsMembership } from "@/src/cms/auth";

const productFormSchema = z.object({
  id: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1_000),
  status: z.enum(["draft", "active", "archived"]),
  price: z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/).optional().or(z.literal("")),
  currency: z.string().trim().toLowerCase().regex(/^[a-z]{3}$/),
  stripeProductId: z.string().trim().max(255).optional(),
  stripePriceId: z.string().trim().max(255).optional(),
  trainerizePlanId: z.string().trim().max(255).optional(),
}).superRefine((value, context) => {
  if (value.status === "active" && (!value.price || !value.stripePriceId)) {
    context.addIssue({ code: "custom", path: ["status"], message: "Actieve producten vereisen prijs en Stripe price ID." });
  }
});

export async function saveCmsProduct(formData: FormData) {
  const { supabase, userId, membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/producten?status=owner-required");
  const parsed = productFormSchema.safeParse({
    id: formData.get("id"), slug: formData.get("slug"), name: formData.get("name"), description: formData.get("description"),
    status: formData.get("status"), price: formData.get("price"), currency: formData.get("currency"),
    stripeProductId: formData.get("stripeProductId"), stripePriceId: formData.get("stripePriceId"), trainerizePlanId: formData.get("trainerizePlanId"),
  });
  if (!parsed.success) redirect("/beheer/producten?status=invalid-product");
  const priceCents = parsed.data.price ? Math.round(Number(parsed.data.price.replace(",", ".")) * 100) : null;
  const { error } = await supabase.from("cms_products").upsert({
    id: parsed.data.id,
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    status: parsed.data.status,
    price_cents: priceCents,
    currency: parsed.data.currency,
    stripe_product_id: parsed.data.stripeProductId || null,
    stripe_price_id: parsed.data.stripePriceId || null,
    trainerize_plan_id: parsed.data.trainerizePlanId || null,
    created_by: userId,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) redirect("/beheer/producten?status=save-failed");
  revalidatePath("/beheer/producten");
  redirect("/beheer/producten?status=saved");
}
