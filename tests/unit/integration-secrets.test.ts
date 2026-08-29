import { describe, expect, it } from "vitest";
import { environmentCredentialName, integrationCredentialSchema } from "@/src/operations/secrets";

describe("integration secret slots", () => {
  it("maps each supported credential to a server-only environment fallback", () => {
    expect(environmentCredentialName("stripe", "secret_key")).toBe("STRIPE_SECRET_KEY");
    expect(environmentCredentialName("openrouter", "management_key")).toBe("OPENROUTER_MANAGEMENT_KEY");
    expect(environmentCredentialName("trainerize", "api_key")).toBe("TRAINERIZE_API_KEY");
    expect(environmentCredentialName("calendly", "scheduling_url")).toBe("CALENDLY_SCHEDULING_URL");
  });

  it("rejects unsupported provider/credential combinations", () => {
    expect(integrationCredentialSchema.safeParse({ provider: "stripe", credentialName: "management_key", value: "long-secret-value" }).success).toBe(false);
  });
});
