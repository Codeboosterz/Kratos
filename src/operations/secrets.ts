import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/src/supabase/admin";
import { integrationIds, integrationDefinitions, type IntegrationId } from "@/src/operations/integrations";

const credentialNames = Object.fromEntries(
  integrationDefinitions.map((definition) => [definition.id, definition.credentials.map((credential) => credential.name)]),
) as Record<IntegrationId, string[]>;

export const integrationCredentialSchema = z.object({
  provider: z.enum(integrationIds),
  credentialName: z.string().trim().min(1).max(80),
  value: z.string().trim().min(8).max(8_192),
}).superRefine((value, context) => {
  if (!credentialNames[value.provider].includes(value.credentialName)) {
    context.addIssue({ code: "custom", path: ["credentialName"], message: "Ongeldige credential voor deze integratie." });
  }
});

const environmentSlots: Record<IntegrationId, Record<string, string>> = {
  stripe: {
    secret_key: "STRIPE_SECRET_KEY",
    publishable_key: "STRIPE_PUBLISHABLE_KEY",
    webhook_secret: "STRIPE_WEBHOOK_SECRET",
  },
  resend: { api_key: "RESEND_API_KEY", webhook_secret: "RESEND_WEBHOOK_SECRET" },
  trainerize: { api_key: "TRAINERIZE_API_KEY", webhook_secret: "TRAINERIZE_WEBHOOK_SECRET" },
  openrouter: { api_key: "OPENROUTER_API_KEY", management_key: "OPENROUTER_MANAGEMENT_KEY" },
  calendly: {
    access_token: "CALENDLY_ACCESS_TOKEN",
    webhook_signing_key: "CALENDLY_WEBHOOK_SIGNING_KEY",
    scheduling_url: "CALENDLY_SCHEDULING_URL",
  },
};

export function environmentCredentialName(provider: IntegrationId, credentialName: string) {
  return environmentSlots[provider][credentialName] ?? null;
}

export async function resolveIntegrationSecret(provider: IntegrationId, credentialName: string) {
  const environmentName = environmentCredentialName(provider, credentialName);
  const environmentValue = environmentName ? process.env[environmentName]?.trim() : null;
  if (environmentValue) return environmentValue;

  if (!process.env.SUPABASE_SECRET_KEY?.trim()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_integration_secret_for_server", {
    target_provider: provider,
    target_credential_name: credentialName,
  });
  if (error) throw new Error(`Secret kon niet veilig worden opgehaald: ${error.message}`);
  return typeof data === "string" && data.trim() ? data.trim() : null;
}
