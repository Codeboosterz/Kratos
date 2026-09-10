import "server-only";

import Stripe from "stripe";
import { getOpenRouterOverview } from "@/src/operations/openrouter";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import type { IntegrationId, IntegrationState } from "@/src/operations/integrations";
import { getStripeReadiness } from "@/src/operations/stripe-configuration";

export type ConnectionCheck = {
  status: IntegrationState;
  message: string;
  checkedAt: string;
  telemetry?: Awaited<ReturnType<typeof getOpenRouterOverview>>;
};

async function checkedFetch(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Provider antwoordde met status ${response.status}.`);
}

export async function checkIntegrationConnection(provider: IntegrationId): Promise<ConnectionCheck> {
  const checkedAt = new Date().toISOString();
  try {
    if (provider === "stripe") {
      const secretKey = await resolveIntegrationSecret("stripe", "secret_key");
      if (!secretKey) return { status: "configuration_required", message: "Secret key ontbreekt.", checkedAt };
      const stripe = new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 8_000 });
      await stripe.balance.retrieve();
      const [publishableKey, webhookSecret] = await Promise.all([resolveIntegrationSecret("stripe", "publishable_key"), resolveIntegrationSecret("stripe", "webhook_secret")]);
      const readiness = getStripeReadiness({ secretKey, publishableKey, webhookSecret });
      if (!readiness.ready) return { status: "configuration_required", message: "Stripe API bereikbaar; checkout vereist bijpassende secret/publishable keys en een webhook secret.", checkedAt };
      return { status: "connected", message: `Stripe API bereikbaar (${readiness.mode}); betaling en webhooklevering moeten apart worden getest.`, checkedAt };
    }

    if (provider === "resend") {
      const apiKey = await resolveIntegrationSecret("resend", "api_key");
      if (!apiKey) return { status: "configuration_required", message: "API key ontbreekt.", checkedAt };
      await checkedFetch("https://api.resend.com/domains", apiKey);
      return { status: "connected", message: "Resend API bereikbaar.", checkedAt };
    }

    if (provider === "trainerize") {
      const [apiKey, healthUrl] = await Promise.all([
        resolveIntegrationSecret("trainerize", "api_key"),
        Promise.resolve(process.env.TRAINERIZE_HEALTH_URL?.trim()),
      ]);
      if (!apiKey || !healthUrl) {
        return { status: "configuration_required", message: "API key en geverifieerde health-URL zijn vereist.", checkedAt };
      }
      await checkedFetch(healthUrl, apiKey);
      return { status: "connected", message: "Trainerize API bereikbaar.", checkedAt };
    }

    if (provider === "calendly") {
      const [accessToken, signingKey, schedulingUrl] = await Promise.all([
        resolveIntegrationSecret("calendly", "access_token"),
        resolveIntegrationSecret("calendly", "webhook_signing_key"),
        resolveIntegrationSecret("calendly", "scheduling_url"),
      ]);
      if (!accessToken || !signingKey || !schedulingUrl) {
        return { status: "configuration_required", message: "Access token, webhook signing key en intake-URL zijn vereist.", checkedAt };
      }
      const url = new URL(schedulingUrl);
      if (url.protocol !== "https:" || (url.hostname !== "calendly.com" && !url.hostname.endsWith(".calendly.com"))) {
        return { status: "configuration_required", message: "De intake scheduling URL is geen geldige Calendly-link.", checkedAt };
      }
      await checkedFetch("https://api.calendly.com/users/me", accessToken);
      return { status: "connected", message: "Calendly API en intakeplanning zijn bereikbaar.", checkedAt };
    }

    const [apiKey, managementKey] = await Promise.all([
      resolveIntegrationSecret("openrouter", "api_key"),
      resolveIntegrationSecret("openrouter", "management_key"),
    ]);
    const telemetry = await getOpenRouterOverview({ apiKey, managementKey });
    return {
      status: telemetry.status,
      message: telemetry.status === "connected" ? "OpenRouter API en gebruiksdata bereikbaar." : telemetry.error ?? "OpenRouter-sleutels zijn nog niet compleet.",
      checkedAt,
      telemetry,
    };
  } catch {
    return {
      status: "degraded",
      // Provider errors can contain the rejected API key. Never persist or render them.
      message: "Verbindingscontrole mislukt. Controleer de sleutel, rechten en providerstatus; er zijn geen geheime foutdetails opgeslagen.",
      checkedAt,
    };
  }
}
