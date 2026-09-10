// Pure validation shared by credential entry and server checkout boundaries.
// This module never reads or returns actual credentials to a client.
export function isStripeCredential(credentialName: string, value: string) {
  if (credentialName === "secret_key") return /^(sk|rk)_(test|live)_[A-Za-z0-9]{8,}$/.test(value);
  if (credentialName === "publishable_key") return /^pk_(test|live)_[A-Za-z0-9]{8,}$/.test(value);
  if (credentialName === "webhook_secret") return /^whsec_[A-Za-z0-9+/=_-]{8,}$/.test(value);
  return false;
}

export function getStripeReadiness(input: { secretKey: string | null; publishableKey: string | null; webhookSecret: string | null }) {
  const validSecret = isStripeCredential("secret_key", input.secretKey ?? "");
  const validPublic = isStripeCredential("publishable_key", input.publishableKey ?? "");
  const mode = validSecret ? input.secretKey!.split("_")[1] as "test" | "live" : null;
  const matchingMode = validPublic && input.publishableKey!.split("_")[1] === mode;
  return { ready: Boolean(validSecret && matchingMode && isStripeCredential("webhook_secret", input.webhookSecret ?? "")), mode };
}
