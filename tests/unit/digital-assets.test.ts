import { describe, expect, it } from "vitest";
import { resolvePdfAiProvider, validatePdfBytes } from "@/src/operations/digital-assets";

describe("private digital assets", () => {
  it("requires a PDF signature and enforces the 20 MB cap", () => {
    expect(validatePdfBytes(new Uint8Array(Buffer.from("%PDF-1.7\ncontent")), "application/pdf")).toEqual({ ok: true });
    expect(validatePdfBytes(new Uint8Array(Buffer.from("not a pdf")), "application/pdf")).toEqual({ ok: false, reason: "invalid_signature" });
    expect(validatePdfBytes(new Uint8Array(Buffer.from("%PDF-1.7")), "text/plain")).toEqual({ ok: false, reason: "invalid_mime" });
  });

  it("uses OpenRouter Claude 4.6 by default", () => {
    expect(resolvePdfAiProvider({ OPENROUTER_API_KEY: "key" })).toMatchObject({
      provider: "openrouter",
      model: "anthropic/claude-sonnet-4.6",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
    });
  });

  it("supports an explicitly configured OpenAI-compatible Sol 5.6 backend", () => {
    expect(resolvePdfAiProvider({
      AI_PDF_PROVIDER: "sol",
      SOL_API_BASE_URL: "https://models.example.test/v1",
      SOL_API_KEY: "secret",
      SOL_PDF_MODEL: "gpt-5.6-sol",
    })).toMatchObject({ provider: "sol", model: "gpt-5.6-sol", endpoint: "https://models.example.test/v1/chat/completions" });
  });
});
