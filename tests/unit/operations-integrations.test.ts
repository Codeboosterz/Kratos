import { describe, expect, it } from "vitest";
import {
  integrationDefinitions,
  maskCredential,
  normalizeOpenRouterCredits,
  normalizeOpenRouterKeyUsage,
} from "@/src/operations/integrations";

describe("CMS integration registry", () => {
  it("defines every approved provider and the credential slots needed to activate it", () => {
    expect(integrationDefinitions.map((definition) => definition.id)).toEqual([
      "stripe",
      "resend",
      "trainerize",
      "openrouter",
      "calendly",
    ]);
    expect(integrationDefinitions.find((definition) => definition.id === "calendly")?.credentials.map((item) => item.name)).toEqual([
      "access_token",
      "webhook_signing_key",
      "scheduling_url",
    ]);
    expect(integrationDefinitions.find((definition) => definition.id === "openrouter")?.credentials.map((item) => item.name)).toEqual([
      "api_key",
      "management_key",
    ]);
  });

  it("never returns a recoverable credential value to the browser", () => {
    expect(maskCredential("sk-or-v1-super-secret-value")).toBe("sk-o••••alue");
    expect(maskCredential("short")).toBe("••••••••");
  });

  it("normalizes OpenRouter credit and API-key usage without exposing provider payloads", () => {
    expect(normalizeOpenRouterCredits({ data: { total_credits: 100.5, total_usage: 25.75 } })).toEqual({
      totalCreditsUsd: 100.5,
      totalUsageUsd: 25.75,
      remainingCreditsUsd: 74.75,
    });
    expect(normalizeOpenRouterKeyUsage({ data: { usage: 25.5, usage_daily: 1.5, usage_weekly: 7, usage_monthly: 25.5, limit: 100, limit_remaining: 74.5, limit_reset: "monthly" } })).toEqual({
      usageUsd: 25.5,
      dailyUsageUsd: 1.5,
      weeklyUsageUsd: 7,
      monthlyUsageUsd: 25.5,
      limitUsd: 100,
      remainingLimitUsd: 74.5,
      limitReset: "monthly",
    });
  });
});
