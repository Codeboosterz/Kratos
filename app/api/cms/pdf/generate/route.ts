import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { getCmsMembership } from "@/src/cms/auth";
import { resolvePdfAiProvider, safeAssetFilename } from "@/src/operations/digital-assets";
import { generatedPdfContentSchema, generatedPdfJsonSchema, pdfGenerationRequestSchema, buildPdfGenerationPrompt, renderKratosPdf } from "@/src/operations/pdf-generation";
import { requestStructuredCompletion } from "@/src/operations/openrouter";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { checkDurableRateLimit } from "@/src/server/rate-limit";
import { createAdminClient } from "@/src/supabase/admin";

const requestSchema = pdfGenerationRequestSchema.omit({ model: true }).extend({ productId: z.string().trim().min(2).max(120) });

export async function POST(request: Request) {
  const authenticated = await getCmsMembership();
  if (!authenticated) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Log opnieuw in." } }, { status: 401 });
  if (authenticated.membership.role === "editor") return Response.json({ error: { code: "FORBIDDEN", message: "Eigenaarstoegang vereist." } }, { status: 403 });
  const limit = await checkDurableRateLimit({ namespace: "cms-ai-pdf", key: authenticated.userId, limit: 3, windowMs: 60 * 60_000 });
  if (!limit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Maximaal drie PDF-generaties per uur." } }, { status: 429 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldige aanvraag." } }, { status: 400 }); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: { code: "INVALID_INPUT", message: "Controleer titel, doelgroep, doel en bronnotities." } }, { status: 400 });

  const selectedProvider = process.env.AI_PDF_PROVIDER?.trim().toLowerCase() === "sol" ? "sol" : "openrouter";
  const openRouterKey = selectedProvider === "openrouter" ? await resolveIntegrationSecret("openrouter", "api_key") : null;
  const provider = resolvePdfAiProvider(selectedProvider === "openrouter" ? {
    AI_PDF_PROVIDER: "openrouter", OPENROUTER_API_KEY: openRouterKey ?? undefined, OPENROUTER_PDF_MODEL: process.env.OPENROUTER_PDF_MODEL,
  } : {
    AI_PDF_PROVIDER: "sol", SOL_API_BASE_URL: process.env.SOL_API_BASE_URL, SOL_API_KEY: process.env.SOL_API_KEY, SOL_PDF_MODEL: process.env.SOL_PDF_MODEL,
  });
  if (!provider) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: selectedProvider === "sol" ? "Sol 5.6-backend is niet compleet geconfigureerd." : "OpenRouter inference key ontbreekt." } }, { status: 503 });

  let admin;
  try { admin = createAdminClient(); } catch { return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Supabase server key ontbreekt." } }, { status: 503 }); }
  const startedAt = Date.now();
  const { data: job, error: jobError } = await admin.from("ai_jobs").insert({
    job_type: "pdf_generation", model: provider.model, status: "running", created_by: authenticated.userId,
    input_summary: { productId: parsed.data.productId, title: parsed.data.title, provider: provider.provider },
  }).select("id").single();
  if (jobError || !job) return Response.json({ error: { code: "DATABASE_FAILURE", message: "AI-taak kon niet worden gestart." } }, { status: 502 });

  try {
    const completion = await requestStructuredCompletion({
      endpoint: provider.endpoint, apiKey: provider.apiKey, model: provider.model,
      prompt: buildPdfGenerationPrompt({ ...parsed.data, model: provider.model }), schemaName: "kratos_pdf_content", jsonSchema: generatedPdfJsonSchema,
    });
    const content = generatedPdfContentSchema.parse(completion.content);
    const pdfBytes = await renderKratosPdf(content);
    const filename = safeAssetFilename(content.title);
    const storagePath = `${parsed.data.productId}/${randomUUID()}-${filename}`;
    const checksum = createHash("sha256").update(pdfBytes).digest("hex");
    const { error: uploadError } = await admin.storage.from("digital-products").upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw new Error(`Privéopslag mislukt: ${uploadError.message}`);
    const { data: asset, error: assetError } = await admin.from("digital_assets").insert({
      storage_path: storagePath, filename, mime_type: "application/pdf", size_bytes: pdfBytes.byteLength,
      source: "ai_generated", status: "draft", checksum_sha256: checksum, created_by: authenticated.userId,
    }).select("id").single();
    if (assetError || !asset) throw new Error(`Assetregistratie mislukt: ${assetError?.message ?? "geen record"}`);
    await Promise.all([
      admin.from("cms_products").update({ digital_asset_id: asset.id, updated_by: authenticated.userId, updated_at: new Date().toISOString() }).eq("id", parsed.data.productId),
      admin.from("ai_usage_events").insert({ ai_job_id: job.id, provider: provider.provider, model: completion.model, prompt_tokens: completion.usage.promptTokens, completion_tokens: completion.usage.completionTokens, cost_usd: completion.usage.costUsd, latency_ms: Date.now() - startedAt }),
      admin.from("ai_jobs").update({ status: "completed", output_asset_id: asset.id, completed_at: new Date().toISOString() }).eq("id", job.id),
    ]);
    return Response.json({ message: "Concept-PDF gegenereerd, privé opgeslagen en gekoppeld.", assetId: asset.id, jobId: job.id });
  } catch (error) {
    await admin.from("ai_jobs").update({ status: "failed", error_code: "GENERATION_FAILED", completed_at: new Date().toISOString() }).eq("id", job.id);
    return Response.json({ error: { code: "GENERATION_FAILED", message: error instanceof Error ? error.message.slice(0, 500) : "PDF-generatie mislukt." } }, { status: 502 });
  }
}
