"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCmsMembership } from "@/src/cms/auth";
import { createClaimToken, hashClaimToken } from "@/src/operations/fulfillment";
import { sendDigitalDeliveryEmail } from "@/src/operations/resend";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { provisionTrainerizeClient } from "@/src/operations/trainerize-api";
import { createAdminClient } from "@/src/supabase/admin";

const idSchema = z.uuid();

export async function resendDigitalDelivery(formData: FormData) {
  const { membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/bestellingen?status=owner-required");
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) redirect("/beheer/bestellingen?status=invalid-order");
  const [apiKey, from] = await Promise.all([resolveIntegrationSecret("resend", "api_key").catch(() => null), Promise.resolve(process.env.RESEND_FROM_EMAIL?.trim())]);
  if (!apiKey || !from) redirect("/beheer/bestellingen?status=resend-config-required");
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, customer_email, product_id").eq("id", orderId.data).maybeSingle();
  if (!order) redirect("/beheer/bestellingen?status=invalid-order");
  const { data: product } = await admin.from("cms_products").select("name, digital_asset_id").eq("id", order.product_id).maybeSingle();
  if (!product?.digital_asset_id) redirect("/beheer/bestellingen?status=no-ready-asset");
  const { data: asset } = await admin.from("digital_assets").select("id, status").eq("id", product.digital_asset_id).maybeSingle();
  if (!asset || asset.status !== "ready") redirect("/beheer/bestellingen?status=no-ready-asset");
  const token = createClaimToken();
  const { error: entitlementError } = await admin.from("entitlements").upsert({
    order_id: order.id, asset_id: asset.id, status: "active", claim_token_hash: hashClaimToken(token), expires_at: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
  }, { onConflict: "order_id" });
  if (entitlementError) redirect("/beheer/bestellingen?status=delivery-failed");
  const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kratosfitness.be"}/api/download/${token}`;
  try {
    await sendDigitalDeliveryEmail({ apiKey, from, to: order.customer_email, productName: product.name, claimUrl, orderId: `${order.id}-${Date.now()}` });
    await admin.from("orders").update({ status: "fulfilled", fulfilled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id);
  } catch { redirect("/beheer/bestellingen?status=delivery-failed"); }
  revalidatePath("/beheer/bestellingen");
  redirect("/beheer/bestellingen?status=delivery-sent");
}

export async function runTrainerizeProvisioning(formData: FormData) {
  const { membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/bestellingen?status=owner-required");
  const jobId = idSchema.safeParse(formData.get("jobId"));
  if (!jobId.success) redirect("/beheer/bestellingen?status=invalid-job");
  const admin = createAdminClient();
  const { data: job } = await admin.from("trainerize_provisioning_jobs").select("id, order_id, trainerize_plan_id, attempts").eq("id", jobId.data).maybeSingle();
  if (!job) redirect("/beheer/bestellingen?status=invalid-job");
  const { data: order } = await admin.from("orders").select("id, customer_email").eq("id", job.order_id).maybeSingle();
  if (!order) redirect("/beheer/bestellingen?status=invalid-order");
  await admin.from("trainerize_provisioning_jobs").update({ status: "running", attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq("id", job.id);
  try {
    const apiKey = await resolveIntegrationSecret("trainerize", "api_key").catch(() => null);
    const result = await provisionTrainerizeClient({ externalId: order.id, email: order.customer_email, planId: job.trainerize_plan_id }, apiKey);
    if (result.status === "configuration_required") {
      await admin.from("trainerize_provisioning_jobs").update({ status: "failed", last_error: "Trainerize endpointconfiguratie ontbreekt.", updated_at: new Date().toISOString() }).eq("id", job.id);
      redirect("/beheer/bestellingen?status=trainerize-config-required");
    }
    await Promise.all([
      admin.from("trainerize_provisioning_jobs").update({ status: "completed", last_error: null, updated_at: new Date().toISOString() }).eq("id", job.id),
      admin.from("orders").update({ status: "fulfilled", fulfilled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", order.id),
    ]);
  } catch (error) {
    await admin.from("trainerize_provisioning_jobs").update({ status: "failed", last_error: error instanceof Error ? error.message.slice(0, 500) : "Provisioning mislukt.", updated_at: new Date().toISOString() }).eq("id", job.id);
    redirect("/beheer/bestellingen?status=trainerize-failed");
  }
  revalidatePath("/beheer/bestellingen");
  redirect("/beheer/bestellingen?status=trainerize-complete");
}
