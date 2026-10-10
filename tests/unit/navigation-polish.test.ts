import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const header = readFileSync("components/site-header.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

describe("shared navigation accessibility contracts", () => {
  it("dismisses on Escape and restores trigger focus", () => {
    expect(header).toContain('event.key === "Escape"');
    expect(header).toContain("menuButton.current?.focus()");
  });
  it("marks the active mobile route, including product children", () => {
    expect(header).toContain('pathname.startsWith(`${href}/`)');
    expect(header).toContain('aria-current={isActive(href) ? "page" : undefined}');
  });
  it("bounds the menu on short screens and hides it above the breakpoint", () => {
    expect(styles).toContain("max-height: calc(100dvh - 68px)");
    expect(styles).toContain("@media (min-width: 1101px)");
    expect(styles).toContain(".mobile-nav { display: none; }");
  });
});
