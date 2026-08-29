import { z } from "zod";
import { calculateAdultBmi, estimateDailyCalories } from "@/src/operations/free-tools";
import { requestStructuredCompletion } from "@/src/operations/openrouter";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { checkDurableRateLimit, requestClientKey } from "@/src/server/rate-limit";
import { createAdminClient } from "@/src/supabase/admin";

const requestSchema = z.discriminatedUnion("tool", [
  z.object({ tool: z.literal("bmi"), heightCm: z.number(), weightKg: z.number() }),
  z.object({ tool: z.literal("calories"), heightCm: z.number(), weightKg: z.number(), age: z.number(), formulaSex: z.enum(["male", "female"]), activity: z.enum(["sedentary", "light", "moderate", "active"]) }),
]);
const explanationSchema = z.object({ summary: z.string().min(10).max(500), context: z.array(z.string().min(5).max(240)).min(2).max(4), caution: z.string().min(10).max(400) });
const jsonSchema = { type: "object", additionalProperties: false, required: ["summary", "context", "caution"], properties: { summary: { type: "string", minLength: 10, maxLength: 500 }, context: { type: "array", minItems: 2, maxItems: 4, items: { type: "string", minLength: 5, maxLength: 240 } }, caution: { type: "string", minLength: 10, maxLength: 400 } } } as const;

export async function POST(request: Request) {
  const rateLimit = await checkDurableRateLimit({ namespace: "free-tool-ai", key: requestClientKey(request), limit: 5, windowMs: 60 * 60_000 });
  if (!rateLimit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Maximaal vijf AI-uitlegvragen per uur." } }, { status: 429 });
  let input: unknown; try { input = await request.json(); } catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldige aanvraag." } }, { status: 400 }); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: { code: "INVALID_INPUT", message: "Controleer de invoer." } }, { status: 400 });
  let result: ReturnType<typeof calculateAdultBmi> | ReturnType<typeof estimateDailyCalories>;
  try { result = parsed.data.tool === "bmi" ? calculateAdultBmi(parsed.data) : estimateDailyCalories(parsed.data); }
  catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Invoer valt buiten het ondersteunde volwassenbereik." } }, { status: 400 }); }
  const apiKey = await resolveIntegrationSecret("openrouter", "api_key").catch(() => null);
  if (!apiKey) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "AI-uitleg is nog niet geconfigureerd." } }, { status: 503 });
  const model = process.env.OPENROUTER_TOOLS_MODEL?.trim() || "anthropic/claude-sonnet-4.6";
  const prompt = [
    "Geef een korte Nederlandse uitleg bij een reeds deterministisch berekend fitnessresultaat.",
    "Herbereken of wijzig het resultaat niet. Geen diagnose, behandelplan, dieetvoorschrift of claims.",
    "Leg onzekerheid en beperkingen duidelijk uit en adviseer professioneel overleg bij zorgen.",
    parsed.data.tool === "bmi" ? "Bronkader: CDC volwassen-BMI; BMI is uitsluitend een screeningsmaat en maakt geen onderscheid tussen spier- en vetmassa." : "Bronkader: Mifflin-St Jeor voorspelt rustenergie; onderhoud is een ruwe activiteitsfactor en kan in de praktijk afwijken.",
    `Geverifieerd resultaat: ${JSON.stringify(result)}`,
  ].join("\n\n");
  const startedAt = Date.now();
  try {
    const completion = await requestStructuredCompletion({ endpoint: "https://openrouter.ai/api/v1/chat/completions", apiKey, model, prompt, schemaName: "tool_explanation", jsonSchema });
    const explanation = explanationSchema.parse(completion.content);
    if (process.env.SUPABASE_SECRET_KEY?.trim()) {
      const admin = createAdminClient();
      const { data: job } = await admin.from("ai_jobs").insert({ job_type: "free_tool_explanation", model, status: "completed", input_summary: { tool: parsed.data.tool }, completed_at: new Date().toISOString() }).select("id").single();
      await admin.from("ai_usage_events").insert({ ai_job_id: job?.id ?? null, provider: "openrouter", model: completion.model, prompt_tokens: completion.usage.promptTokens, completion_tokens: completion.usage.completionTokens, cost_usd: completion.usage.costUsd, latency_ms: Date.now() - startedAt });
    }
    return Response.json({ result, explanation });
  } catch { return Response.json({ error: { code: "PROVIDER_FAILURE", message: "AI-uitleg is tijdelijk niet beschikbaar; het berekende resultaat blijft geldig als indicatie." } }, { status: 502 }); }
}
