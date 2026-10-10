import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { cmsPageDefaults, getCmsPageDefinition, parseStoredCmsPageContent } from "@/src/cms/site-page-definitions";

it("publishes the supplied founder story through editable CMS defaults", () => {
  const definition = getCmsPageDefinition("over-omar")!;
  const copy = cmsPageDefaults(definition);
  expect(copy.hero_title).toBe("Omar Ellis.");
  expect(copy.coach_text).toContain("België");
  expect(copy.community_text).toContain("Chearl");
  expect(copy.community_text).toContain("God");
  expect(parseStoredCmsPageContent(definition, copy).success).toBe(true);
});

it("upgrades legacy defaults while preserving custom CMS copy and photos", () => {
  const definition = getCmsPageDefinition("over-omar")!;
  const result = parseStoredCmsPageContent(definition, {hero_title: "Aandacht", hero_intro: "Mijn eigen introductie.", hero_image_url: "/images/custom.jpg"});
  expect(result.success).toBe(true);
  if (!result.success) return;
  expect(result.data.hero_title).toBe("Omar Ellis.");
  expect(result.data.hero_intro).toBe("Mijn eigen introductie.");
  expect(result.data.hero_image_url).toBe("/images/custom.jpg");
});

it("retires results navigation and retains a permanent link to homepage stories", () => {
  for (const path of ["components/site-header.tsx", "components/site-footer.tsx", "app/sitemap.ts"]) {
    expect(readFileSync(path, "utf8")).not.toContain('"/resultaten"');
  }
  expect(readFileSync("app/resultaten/page.tsx", "utf8")).toContain('permanentRedirect("/#reviews-title")');
  expect(getCmsPageDefinition("resultaten")).toBeNull();
});
