import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps configuration explanations out of public intake confirmation", () => {
  const source = readFileSync("components/intake-form.tsx", "utf8");
  expect(source).not.toContain("De agenda is nog niet gekoppeld");
  expect(source).not.toContain("Zodra de Calendly-koppeling actief is");
  expect(source).not.toContain("zodra Calendly is gekoppeld");
  expect(source).toContain("We nemen persoonlijk contact met je op om je doelen en een passend moment te bespreken.");
  expect(source).toContain("<CalendlyEmbed url={schedulingUrl}");
  expect(source).toContain("Aanvraag opgeslagen");
});
