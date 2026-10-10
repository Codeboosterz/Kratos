import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("shares the community timeline with tall mobile screens and keeps safe fallback conditions", () => {
  const component = readFileSync("components/editorial-motion.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  expect(component).toContain('portrait: "(max-width: 900px) and (min-height: 600px)"');
  expect(component).toContain("context.conditions?.portrait && !context.conditions?.reduced");
  expect(css).toContain("@media (max-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)");
  expect(css).toContain("--community-pin-distance: max(120svh, 900px)");
});
