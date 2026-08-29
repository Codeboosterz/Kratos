import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";

export const pdfGenerationRequestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  audience: z.string().trim().min(2).max(240),
  objective: z.string().trim().min(2).max(600),
  sourceNotes: z.string().trim().min(20).max(20_000),
  model: z.string().trim().min(3).max(120).default("anthropic/claude-sonnet-4.6"),
});

export const generatedPdfContentSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().min(2).max(240),
  sections: z.array(z.object({ heading: z.string().trim().min(2).max(100), body: z.string().trim().min(10).max(4_000) })).min(1).max(12),
  disclaimer: z.string().trim().min(10).max(500),
});

export type PdfGenerationRequest = z.infer<typeof pdfGenerationRequestSchema>;
export type GeneratedPdfContent = z.infer<typeof generatedPdfContentSchema>;

export const generatedPdfJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subtitle", "sections", "disclaimer"],
  properties: {
    title: { type: "string", minLength: 2, maxLength: 120 },
    subtitle: { type: "string", minLength: 2, maxLength: 240 },
    sections: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "body"],
        properties: {
          heading: { type: "string", minLength: 2, maxLength: 100 },
          body: { type: "string", minLength: 10, maxLength: 4_000 },
        },
      },
    },
    disclaimer: { type: "string", minLength: 10, maxLength: 500 },
  },
} as const;

export function buildPdfGenerationPrompt(input: PdfGenerationRequest) {
  return [
    "Je bent de redactionele assistent van Kratos Fitness.",
    "Schrijf uitsluitend in het Nederlands.",
    "Gebruik alleen de aangeleverde bronnotities. Verzin geen resultaten, prijzen, medische claims of kwalificaties.",
    "Geen diagnose, behandeling of individueel medisch advies. Gebruik voorzichtige, algemene fitness- en leefstijltaal.",
    "Lever compacte, praktische tekst op die direct als PDF kan worden vormgegeven.",
    `Titel: ${input.title}`,
    `Doelgroep: ${input.audience}`,
    `Doel: ${input.objective}`,
    `Bronnotities:\n${input.sourceNotes}`,
  ].join("\n\n");
}

function wrapText(text: string, maxCharacters: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderKratosPdf(input: GeneratedPdfContent) {
  const content = generatedPdfContentSchema.parse(input);
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 54;
  let page = document.addPage(pageSize);
  let y = pageSize[1] - margin;

  const addPage = () => { page = document.addPage(pageSize); y = pageSize[1] - margin; };
  const ensureSpace = (height: number) => { if (y - height < margin) addPage(); };
  const drawLines = (text: string, size: number, lineHeight: number, maxCharacters: number, font = regular, color = rgb(0.1, 0.11, 0.09)) => {
    for (const line of wrapText(text, maxCharacters)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= lineHeight;
    }
  };

  page.drawRectangle({ x: 0, y: pageSize[1] - 22, width: pageSize[0], height: 22, color: rgb(0.65, 0.81, 0.32) });
  drawLines("KRATOS FITNESS", 10, 18, 80, bold, rgb(0.25, 0.34, 0.08));
  y -= 26;
  drawLines(content.title.toUpperCase(), 28, 34, 32, bold);
  y -= 8;
  drawLines(content.subtitle, 13, 20, 68, regular, rgb(0.32, 0.34, 0.3));
  y -= 30;

  for (const section of content.sections) {
    ensureSpace(76);
    page.drawText(section.heading.toUpperCase(), { x: margin, y, size: 16, font: bold, color: rgb(0.42, 0.58, 0.08) });
    y -= 24;
    drawLines(section.body, 11, 17, 86);
    y -= 18;
  }

  ensureSpace(70);
  page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 1, color: rgb(0.65, 0.81, 0.32) });
  y -= 20;
  drawLines(content.disclaimer, 9, 14, 100, regular, rgb(0.38, 0.4, 0.36));
  return document.save();
}
