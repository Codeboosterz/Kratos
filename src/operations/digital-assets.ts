import "server-only";

export const maximumPdfBytes = 20 * 1024 * 1024;

export function validatePdfBytes(bytes: Uint8Array, mimeType: string) {
  if (mimeType !== "application/pdf") return { ok: false as const, reason: "invalid_mime" as const };
  if (bytes.byteLength === 0 || bytes.byteLength > maximumPdfBytes) return { ok: false as const, reason: "invalid_size" as const };
  const signature = new TextDecoder().decode(bytes.slice(0, 5));
  if (signature !== "%PDF-") return { ok: false as const, reason: "invalid_signature" as const };
  return { ok: true as const };
}

type PdfProviderEnvironment = Partial<Record<"AI_PDF_PROVIDER" | "OPENROUTER_API_KEY" | "OPENROUTER_PDF_MODEL" | "SOL_API_BASE_URL" | "SOL_API_KEY" | "SOL_PDF_MODEL", string>>;

export function resolvePdfAiProvider(environment: PdfProviderEnvironment = process.env as PdfProviderEnvironment) {
  const selected = environment.AI_PDF_PROVIDER?.trim().toLowerCase() === "sol" ? "sol" : "openrouter";
  if (selected === "sol") {
    const baseUrl = environment.SOL_API_BASE_URL?.trim().replace(/\/$/, "");
    const apiKey = environment.SOL_API_KEY?.trim();
    if (!baseUrl || !apiKey) return null;
    return { provider: "sol" as const, endpoint: `${baseUrl}/chat/completions`, apiKey, model: environment.SOL_PDF_MODEL?.trim() || "gpt-5.6-sol" };
  }
  const apiKey = environment.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    provider: "openrouter" as const,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model: environment.OPENROUTER_PDF_MODEL?.trim() || "anthropic/claude-sonnet-4.6",
  };
}

export function safeAssetFilename(value: string) {
  const extensionless = value.toLowerCase().replace(/\.pdf$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${extensionless || "kratos-document"}.pdf`;
}
