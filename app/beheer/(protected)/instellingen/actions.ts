"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCmsMembership } from "@/src/cms/auth";
import { checkIntegrationConnection } from "@/src/operations/health";
import { integrationCredentialSchema } from "@/src/operations/secrets";
import { integrationIds, type IntegrationId } from "@/src/operations/integrations";

function settingsStatus(code: string, provider?: string) {
  const params = new URLSearchParams({ status: code });
  if (provider) params.set("provider", provider);
  return `/beheer/instellingen?${params.toString()}`;
}

export async function saveIntegrationCredential(formData: FormData) {
  const { supabase, membership } = await requireCmsMembership();
  if (membership.role !== "super_admin") redirect(settingsStatus("super-admin-required"));

  const parsed = integrationCredentialSchema.safeParse({
    provider: formData.get("provider"),
    credentialName: formData.get("credentialName"),
    value: formData.get("value"),
  });
  if (!parsed.success) redirect(settingsStatus("invalid-credential"));

  const { error } = await supabase.rpc("cms_store_integration_secret", {
    target_provider: parsed.data.provider,
    target_credential_name: parsed.data.credentialName,
    secret_value: parsed.data.value,
  });
  if (error) redirect(settingsStatus("save-failed", parsed.data.provider));
  revalidatePath("/beheer/instellingen");
  redirect(settingsStatus("saved", parsed.data.provider));
}

export async function testIntegration(formData: FormData) {
  const { supabase, membership } = await requireCmsMembership();
  if (membership.role !== "super_admin") redirect(settingsStatus("super-admin-required"));
  const rawProvider = formData.get("provider");
  if (typeof rawProvider !== "string" || !integrationIds.includes(rawProvider as IntegrationId)) {
    redirect(settingsStatus("invalid-provider"));
  }
  const provider = rawProvider as IntegrationId;
  const result = await checkIntegrationConnection(provider);
  const { error } = await supabase.from("integration_connections").update({
    status: result.status,
    last_checked_at: result.checkedAt,
    last_error: result.status === "connected" ? null : result.message,
  }).eq("provider", provider);
  if (error) redirect(settingsStatus("health-save-failed", provider));
  revalidatePath("/beheer/instellingen");
  redirect(settingsStatus(result.status === "connected" ? "connected" : "connection-failed", provider));
}
