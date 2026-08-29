import { describe, expect, it, vi } from "vitest";
import { getOpenRouterOverview, requestStructuredCompletion } from "@/src/operations/openrouter";

describe("OpenRouter operations", () => {
  it("combines management-credit data with inference-key usage", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { total_credits: 25, total_usage: 4.5 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { usage: 2, usage_daily: 0.2, usage_weekly: 0.8, usage_monthly: 2, limit: 10, limit_remaining: 8 } }), { status: 200 }));

    const overview = await getOpenRouterOverview({
      apiKey: "sk-or-inference",
      managementKey: "sk-or-management",
      fetcher,
    });

    expect(overview.status).toBe("connected");
    expect(overview.credits?.remainingCreditsUsd).toBe(20.5);
    expect(overview.keyUsage?.monthlyUsageUsd).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not pretend the integration works without credentials", async () => {
    const overview = await getOpenRouterOverview({ fetcher: vi.fn() });
    expect(overview.status).toBe("configuration_required");
    expect(overview.credits).toBeNull();
  });

  it("forces structured output and data-collection denial", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "generation-1",
      model: "anthropic/claude-sonnet-4.6",
      choices: [{ message: { content: "{\"answer\":\"ok\"}" } }],
      usage: { prompt_tokens: 12, completion_tokens: 4, cost: 0.01 },
    }), { status: 200 }));

    await requestStructuredCompletion({
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: "sk-or-inference",
      model: "anthropic/claude-sonnet-4.6",
      prompt: "Maak veilige inhoud.",
      schemaName: "result",
      jsonSchema: { type: "object", properties: { answer: { type: "string" } }, required: ["answer"], additionalProperties: false },
      fetcher,
    });

    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.provider.data_collection).toBe("deny");
    expect(body.provider.require_parameters).toBe(true);
    expect(body.response_format.type).toBe("json_schema");
  });
});
