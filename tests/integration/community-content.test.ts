import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ single: vi.fn() }));
vi.mock("@/src/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/src/supabase/public", () => ({ createPublicClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.single }) }) }) }) }));
import { getPublishedCmsPage } from "@/src/cms/site-pages";

describe("community content upgrade without a database rewrite", () => {
  beforeEach(() => vi.resetAllMocks());
  it("fills new navigation defaults without dropping previously edited fields", async () => {
    mocks.single.mockResolvedValueOnce({ data: { published_revision_id: "old" } }).mockResolvedValueOnce({ data: { content: { nav_tools: "Gratis tools", footer_tagline: "Een eigen omschrijving." } } });
    const content = await getPublishedCmsPage("site-settings");
    expect(content.nav_community).toBe("Faith & Fitness");
    expect(content.footer_tagline).toBe("Een eigen omschrijving.");
  });
  it("does not reuse tool headings for the community and preserves a new custom title", async () => {
    mocks.single.mockResolvedValueOnce({ data: { published_revision_id: "community" } }).mockResolvedValueOnce({ data: { content: { hero_title: "BMI", community_hero_title: "Samen groeien" } } });
    const content = await getPublishedCmsPage("gratis-tools");
    expect(content.community_hero_title).toBe("Samen groeien");
    expect(content.community_hero_accent).toBe("Fitness.");
  });
});
