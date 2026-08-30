import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const story = readFileSync(resolve(process.cwd(), "components/faith-scroll-story.tsx"), "utf8");
const stepper = readFileSync(resolve(process.cwd(), "components/ui/stepper.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("Faith & Fitness scroll stepper", () => {
  it("provides a reusable controlled stepper primitive", () => {
    expect(stepper).toContain("StepperContext");
    expect(stepper).toContain("value?: number");
    expect(stepper).toContain("StepperIndicator");
    expect(stepper).toContain("StepperSeparator");
  });

  it("uses the CMS-driven steps as a scroll-controlled, non-clickable stepper", () => {
    expect(story).toContain('from "@/components/ui/stepper"');
    expect(story).toContain("<Stepper value={activeStep}");
    expect(story).toContain('aria-current={stepValue === activeStep ? "step" : undefined}');
    expect(story).not.toContain("faith-story__progress-fill");
    expect(story).not.toContain("<StepperTrigger");
  });

  it("uses larger height-led cards and a tighter progress handoff", () => {
    expect(styles).toContain(".faith-story__stepper");
    expect(styles).toMatch(/\.faith-story__card\s*\{[^}]*height:\s*clamp\(/s);
    expect(styles).toMatch(/\.faith-story__card\s*\{[^}]*width:\s*auto/s);
    expect(styles).toMatch(/\.faith-story__layout\s*\{[^}]*row-gap:/s);
    expect(styles).not.toContain(".faith-story__progress-fill");
  });
});
