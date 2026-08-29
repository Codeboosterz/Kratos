import { z } from "zod";

export const integrationIds = ["stripe", "resend", "trainerize", "openrouter", "calendly"] as const;
export type IntegrationId = (typeof integrationIds)[number];
export type IntegrationState = "connected" | "not_connected" | "configuration_required" | "permission_expired" | "degraded";

export type IntegrationDefinition = {
  id: IntegrationId;
  name: string;
  description: string;
  credentials: { name: string; label: string; secret: boolean; helper: string }[];
  capabilities: string[];
};

export const integrationDefinitions: IntegrationDefinition[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Betalingen, bestellingen en digitale toegang.",
    credentials: [
      { name: "secret_key", label: "Secret key", secret: true, helper: "Stripe API key met serverrechten." },
      { name: "publishable_key", label: "Publishable key", secret: false, helper: "Publieke sleutel voor Checkout Elements." },
      { name: "webhook_secret", label: "Webhook secret", secret: true, helper: "Ondertekent berichten van Stripe." },
    ],
    capabilities: ["Checkout", "Webhook fulfillment", "Entitlements"],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Transactionele e-mail, bezorgstatus en antwoorden.",
    credentials: [
      { name: "api_key", label: "API key", secret: true, helper: "Resend server API key." },
      { name: "webhook_secret", label: "Webhook secret", secret: true, helper: "Ondertekent bezorg- en inbound-events." },
    ],
    capabilities: ["Transactionele e-mail", "Inbound inbox", "Delivery events"],
  },
  {
    id: "trainerize",
    name: "Trainerize",
    description: "Programma-toewijzing en klantprovisioning.",
    credentials: [
      { name: "api_key", label: "API key", secret: true, helper: "Beschikbaar voor Studio- en Enterprise-accounts." },
      { name: "webhook_secret", label: "Webhook secret", secret: true, helper: "Controleert Trainerize-webhooks indien beschikbaar." },
    ],
    capabilities: ["Klantprovisioning", "Programmamapping", "Voortgangssync"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Claude 4.6, AI-assistentie, PDF-content en gebruiksinzicht.",
    credentials: [
      { name: "api_key", label: "Inference API key", secret: true, helper: "Gebruikt voor modelaanvragen en key-usage." },
      { name: "management_key", label: "Management key", secret: true, helper: "Vereist voor totaaltegoed en 30-dagenactiviteit." },
    ],
    capabilities: ["Claude Sonnet 4.6", "PDF-content", "Credits & usage"],
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Intakeplanning, beschikbaarheid en afspraken in het CMS.",
    credentials: [
      { name: "access_token", label: "Personal access token", secret: true, helper: "Interne API-token met users, scheduled events en webhook scopes." },
      { name: "webhook_signing_key", label: "Webhook signing key", secret: true, helper: "Ondertekent boekingen, annuleringen en verplaatsingen." },
      { name: "scheduling_url", label: "Intake scheduling URL", secret: false, helper: "De openbare Calendly-link van het intakegesprek." },
    ],
    capabilities: ["Datum & tijd kiezen", "Afsprakensync", "Annuleren & verplaatsen"],
  },
];

const creditsPayloadSchema = z.object({ data: z.object({ total_credits: z.number().finite().nonnegative(), total_usage: z.number().finite().nonnegative() }) });
const keyUsagePayloadSchema = z.object({ data: z.object({ usage: z.number().finite().nonnegative().default(0), usage_daily: z.number().finite().nonnegative().default(0), usage_weekly: z.number().finite().nonnegative().default(0), usage_monthly: z.number().finite().nonnegative().default(0), limit: z.number().finite().nonnegative().nullable().optional(), limit_remaining: z.number().finite().nonnegative().nullable().optional(), limit_reset: z.string().nullable().optional() }) });

export function normalizeOpenRouterCredits(payload: unknown) {
  const parsed = creditsPayloadSchema.parse(payload);
  return {
    totalCreditsUsd: parsed.data.total_credits,
    totalUsageUsd: parsed.data.total_usage,
    remainingCreditsUsd: Math.max(0, parsed.data.total_credits - parsed.data.total_usage),
  };
}

export function normalizeOpenRouterKeyUsage(payload: unknown) {
  const parsed = keyUsagePayloadSchema.parse(payload);
  return {
    usageUsd: parsed.data.usage,
    dailyUsageUsd: parsed.data.usage_daily,
    weeklyUsageUsd: parsed.data.usage_weekly,
    monthlyUsageUsd: parsed.data.usage_monthly,
    limitUsd: parsed.data.limit ?? null,
    remainingLimitUsd: parsed.data.limit_remaining ?? null,
    limitReset: parsed.data.limit_reset ?? null,
  };
}

export function maskCredential(value: string) {
  if (value.length < 12) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
