import "server-only";

export const fixtureMode =
  process.env.NODE_ENV !== "production" && process.env.KRATOS_FIXTURE_MODE === "true";

export const trustedSiteOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
})();

export const connectorEnvironment = {
  stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  stripePublishableConfigured: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
  stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  intakeDestinationConfigured:
    process.env.INTAKE_DELIVERY_MODE === "http" && Boolean(process.env.INTAKE_DELIVERY_ENDPOINT),
  databaseConfigured: Boolean(process.env.DATABASE_URL),
};
