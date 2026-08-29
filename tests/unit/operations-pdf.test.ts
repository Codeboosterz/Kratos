import { describe, expect, it } from "vitest";
import { buildPdfGenerationPrompt, pdfGenerationRequestSchema, renderKratosPdf } from "@/src/operations/pdf-generation";

describe("backend PDF generation", () => {
  it("accepts a bounded Dutch guide request and rejects oversized free-form input", () => {
    expect(pdfGenerationRequestSchema.safeParse({ title: "Sterker in 8 weken", audience: "Beginnende sporters", objective: "Een praktisch weekschema", sourceNotes: "Drie trainingen per week.", model: "anthropic/claude-sonnet-4.6" }).success).toBe(true);
    expect(pdfGenerationRequestSchema.safeParse({ title: "x", audience: "y", objective: "z", sourceNotes: "a".repeat(30_000), model: "anthropic/claude-sonnet-4.6" }).success).toBe(false);
  });

  it("locks generation to reviewed source notes, Dutch output and non-medical language", () => {
    const prompt = buildPdfGenerationPrompt({ title: "Voedingsgids", audience: "Kratos klanten", objective: "Dagelijkse structuur", sourceNotes: "Gebruik alleen deze bronnotities.", model: "anthropic/claude-sonnet-4.6" });
    expect(prompt).toContain("Schrijf uitsluitend in het Nederlands");
    expect(prompt).toContain("Geen diagnose");
    expect(prompt).toContain("Gebruik alleen de aangeleverde bronnotities");
  });

  it("renders the approved structured content as a real server-side PDF", async () => {
    const bytes = await renderKratosPdf({ title: "Kratos gids", subtitle: "Veilig opgebouwd", sections: [{ heading: "Start", body: "Dit is gecontroleerde inhoud." }], disclaimer: "Geen medisch advies." });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
