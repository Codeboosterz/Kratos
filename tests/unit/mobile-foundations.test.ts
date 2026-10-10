import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { visibleReviewCards } from "../../src/domain/review-cards";

describe("mobile-first foundations", () => {
  it("omits preparation cards without inventing or rewriting CMS stories", () => {
    const real = { label: "Cliëntverhaal", title: "Mijn ervaring", text: "Gepubliceerde ervaring." };
    expect(visibleReviewCards([{ label: "01", title: "Verhaal in voorbereiding", text: "Placeholder" }, real])).toEqual([real]);
    expect(visibleReviewCards([{ label: "01", title: " VERHAAL IN VOORBEREIDING ", text: "Placeholder" }])).toEqual([]);
  });
  it("connects phone and note errors and uses honest submission copy", () => {
    const form = readFileSync("components/intake-form.tsx", "utf8");
    for (const text of ['id="phone-error"', 'id="note-error"', 'aria-describedby={errors.phone', 'Intake versturen']) {
      expect(form.includes(text), text).toBe(true);
    }
  });
  it("adds contextual routes instead of repeated hero intake actions", () => {
    expect(readFileSync("app/over-omar/page.tsx", "utf8")).toContain('href="/werkwijze"');
    expect(readFileSync("app/werkwijze/page.tsx", "utf8")).toContain('href="/trajecten"');
  });
  it("has explicit shared mobile type and static texture rules", () => {
    const css = readFileSync("app/globals.css", "utf8");
    for (const text of ["--surface-glow:", ".product-card__summary", "touch-action: manipulation", "scroll-margin-block: 6rem", "font-size: 1rem", "env(safe-area-inset-bottom)"]) {
      expect(css.includes(text), text).toBe(true);
    }
  });
});
