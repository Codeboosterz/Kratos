import "server-only";

import { z } from "zod";
import { normalizeOpenRouterCredits, normalizeOpenRouterKeyUsage } from "@/src/operations/integrations";

type Fetcher = typeof fetch;
type OpenRouterOverviewInput = { apiKey?: string | null; managementKey?: string | null; fetcher?: Fetcher };

async function fetchJson(fetcher: Fetcher, url: string, key: string) {
  const response = await fetcher(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`OpenRouter antwoordde met status ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export async function getOpenRouterOverview(input: OpenRouterOverviewInput) {
  const fetcher = input.fetcher ?? fetch;
  if (!input.apiKey && !input.managementKey) {
    return { status: "configuration_required" as const, credits: null, keyUsage: null, checkedAt: null, error: null };
  }

  try {
    const [credits, keyUsage] = await Promise.all([
      input.managementKey
        ? fetchJson(fetcher, "https://openrouter.ai/api/v1/credits", input.managementKey).then(normalizeOpenRouterCredits)
        : Promise.resolve(null),
      input.apiKey
        ? fetchJson(fetcher, "https://openrouter.ai/api/v1/key", input.apiKey).then(normalizeOpenRouterKeyUsage)
        : Promise.resolve(null),
    ]);
    return { status: "connected" as const, credits, keyUsage, checkedAt: new Date().toISOString(), error: null };
  } catch (error) {
    return {
      status: "degraded" as const,
      credits: null,
      keyUsage: null,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "OpenRouter-controle mislukt.",
    };
  }
}

const completionResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string(),
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
  usage: z.object({
    prompt_tokens: z.number().int().nonnegative().default(0),
    completion_tokens: z.number().int().nonnegative().default(0),
    cost: z.number().nonnegative().optional(),
  }).optional(),
});

export type StructuredCompletionInput = {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  fetcher?: Fetcher;
};

export async function requestStructuredCompletion(input: StructuredCompletionInput) {
  const response = await (input.fetcher ?? fetch)(input.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://kratosfitness.be",
      "X-Title": "Kratos CMS",
    },
    body: JSON.stringify({
      model: input.model,
      messages: [{ role: "user", content: input.prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: input.schemaName, strict: true, schema: input.jsonSchema },
      },
      provider: { require_parameters: true, data_collection: "deny", zdr: true },
      temperature: 0.2,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    throw new Error(`AI-provider antwoordde met ${response.status}: ${message}`);
  }
  const parsed = completionResponseSchema.parse(await response.json());
  return {
    id: parsed.id ?? null,
    model: parsed.model,
    content: JSON.parse(parsed.choices[0].message.content) as unknown,
    usage: {
      promptTokens: parsed.usage?.prompt_tokens ?? 0,
      completionTokens: parsed.usage?.completion_tokens ?? 0,
      costUsd: parsed.usage?.cost ?? 0,
    },
  };
}
