import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeProgress } from "@/components/ui/animated-circular-progress-bar";

const dashboardPage = readFileSync(resolve(process.cwd(), "app/beheer/(protected)/page.tsx"), "utf8");
const globalStyles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("CMS animated circular progress", () => {
  it("normalizes empty, reversed, and out-of-range values safely", () => {
    expect(normalizeProgress({ min: 0, max: 100, value: 42 })).toBe(42);
    expect(normalizeProgress({ min: 10, max: 10, value: 10 })).toBe(0);
    expect(normalizeProgress({ min: 100, max: 0, value: 50 })).toBe(50);
    expect(normalizeProgress({ min: 0, max: 100, value: -5 })).toBe(0);
    expect(normalizeProgress({ min: 0, max: 100, value: 140 })).toBe(100);
  });

  it("uses the shared ring for compact publication meters and readiness", () => {
    expect(dashboardPage).toContain('from "@/components/ui/animated-circular-progress-bar"');
    expect(dashboardPage.match(/<AnimatedCircularProgressBar/g)).toHaveLength(2);
    expect(dashboardPage).not.toContain("cms-progress-track");
    expect(dashboardPage).not.toContain("cms-readiness-ring");
  });

  it("keeps progress motion optional for accessibility", () => {
    expect(globalStyles).toContain(".animated-circular-progress");
    expect(globalStyles).toContain("prefers-reduced-motion: reduce");
    expect(globalStyles).toContain("animation: none");
  });
});
