import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("mobile responsive contracts", () => {
  it("keeps horizontal rails swipeable without exposing native scrollbars", () => {
    expect(styles).toContain(".filter-bar, .client-stories-rail, .cms-sidebar nav, .cms-page-tabs, .cms-calendar");
    expect(styles).toContain("scrollbar-width: none");
    expect(styles).toContain("::-webkit-scrollbar");
    expect(styles).toContain("display: none");
  });

  it("uses legible mobile form controls and accessible touch targets", () => {
    expect(styles).toContain(".tool-card--live form input, .tool-card--live form select");
    expect(styles).toContain(".cms-shell input:not([type=\"checkbox\"]):not([type=\"radio\"]):not([type=\"file\"])");
    expect(styles).toContain("font-size: 16px");
    expect(styles).toContain("min-height: 44px");
    expect(styles).toContain(".footer-grid a:not(.brand)");
  });

  it("compacts intake and CMS editor layouts at phone widths", () => {
    expect(styles).toContain(".intake-flow .form-aside");
    expect(styles).toContain(".intake-step-panel { min-height: 0; }");
    expect(styles).toContain(".cms-repeat-grid, .cms-image-grid { grid-template-columns: 1fr; }");
    expect(styles).toContain(".cms-main > *, .cms-page-heading > *, .cms-editor-grid > *, .cms-editor-panel, .cms-editor-form");
  });
});
