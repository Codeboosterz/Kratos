import { describe, expect, it } from "vitest";
import { getStripeReadiness } from "@/src/operations/stripe-configuration";
import { credentialInputType } from "@/src/operations/integrations";
import { integrationCredentialSchema } from "@/src/operations/secrets";

const testKeys = { secretKey: "sk_test_fakefixture123", publishableKey: "pk_test_fakefixture123", webhookSecret: "whsec_fakefixture123" };

describe("Stripe configuration boundary", () => {
  it("accepts publishable keys as text, never as URLs", () => {
    expect(credentialInputType({ name: "publishable_key", secret: false })).toBe("text");
    expect(credentialInputType({ name: "secret_key", secret: true })).toBe("password");
    expect(credentialInputType({ name: "scheduling_url", secret: false })).toBe("url");
  });

  it("validates credential slots without echoing their values", () => {
    for (const [credentialName, value] of Object.entries({ secret_key: testKeys.secretKey, publishable_key: testKeys.publishableKey, webhook_secret: testKeys.webhookSecret })) {
      expect(integrationCredentialSchema.safeParse({ provider: "stripe", credentialName, value }).success).toBe(true);
    }
    for (const value of [testKeys.secretKey, "https://example.com", "pk_test_has spaces", "pk_test_"]) {
      const result = integrationCredentialSchema.safeParse({ provider: "stripe", credentialName: "publishable_key", value });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.message).not.toContain(value);
    }
  });

  it("requires matching keys and a webhook before accepting checkout", () => {
    expect(getStripeReadiness(testKeys)).toMatchObject({ ready: true, mode: "test" });
    expect(getStripeReadiness({ ...testKeys, publishableKey: "pk_live_fakefixture123" }).ready).toBe(false);
    expect(getStripeReadiness({ ...testKeys, publishableKey: testKeys.secretKey }).ready).toBe(false);
    expect(getStripeReadiness({ ...testKeys, publishableKey: null }).ready).toBe(false);
    expect(getStripeReadiness({ ...testKeys, webhookSecret: null }).ready).toBe(false);
    expect(getStripeReadiness({ ...testKeys, secretKey: "rk_test_fakefixture123" }).ready).toBe(true);
    expect(getStripeReadiness({ ...testKeys, secretKey: "sk_live_fakefixture123", publishableKey: "pk_live_fakefixture123" })).toMatchObject({ ready: true, mode: "live" });
  });
});
