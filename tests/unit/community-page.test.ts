import { describe, expect, it } from "vitest";
import { cmsPageDefaults, getCmsPageDefinition, parseCmsPageContent } from "@/src/cms/site-page-definitions";
import { routes } from "@/src/domain/routes";

describe("CMS-editable Faith & Fitness community", () => {
  it("reuses the registered CMS record but presents a community page", () => {
    const definition = getCmsPageDefinition("gratis-tools")!;
    expect(definition.route).toBe("/community");
    expect(definition.title).toBe("Faith & Fitness Community");
    const defaults = cmsPageDefaults(definition);
    expect(defaults.community_hero_title).toBe("Faith &");
    expect(parseCmsPageContent(definition, defaults).success).toBe(true);
    expect(definition.fields.some((item) => item.key.startsWith("tool_"))).toBe(false);
  });
  it("allows owner-authored community content and accessible imagery", () => {
    const definition = getCmsPageDefinition("gratis-tools")!;
    const content = { ...cmsPageDefaults(definition), community_hero_title: "Samen groeien", community_hero_image_alt: "Samen trainen in het park" };
    const parsed = parseCmsPageContent(definition, content);
    expect(parsed.success && parsed.data.community_hero_title).toBe("Samen groeien");
  });
  it("exposes a community route and fresh navigation label", () => {
    expect(routes.community).toBe("/community");
    expect(cmsPageDefaults(getCmsPageDefinition("site-settings")!).nav_community).toBe("Faith & Fitness");
  });
});
