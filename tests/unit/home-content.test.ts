import { describe, expect, it } from "vitest";
import { defaultHomeHero, homeHeroFromFormData, homeHeroSchema } from "@/src/cms/home";

function formDataForFaithSteps(stepCount: number) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(defaultHomeHero)) {
    if (typeof value === "string") formData.set(key, value);
  }

  formData.set("faith_story_layout_version", "2");
  formData.set("faith_story_step_count", String(stepCount));
  Array.from({ length: stepCount }, (_, index) => {
    const source = defaultHomeHero.faith_story_steps[index % defaultHomeHero.faith_story_steps.length];
    formData.set(`faith_story_${index}_title`, `${source.title} ${index + 1}`);
    formData.set(`faith_story_${index}_text`, source.text);
    formData.set(`faith_story_${index}_image_url`, source.image_url);
    formData.set(`faith_story_${index}_image_alt`, source.image_alt);
  });

  defaultHomeHero.community_image_urls.forEach((url, index) => {
    formData.set(`community_image_url_${index}`, url);
  });
  defaultHomeHero.review_cards.forEach((card, index) => {
    formData.set(`review_${index}_label`, card.label);
    formData.set(`review_${index}_title`, card.title);
    formData.set(`review_${index}_text`, card.text);
  });

  return formData;
}

describe("Faith & Fitness CMS content", () => {
  it("ships the approved six-chapter filmstrip as the homepage default", () => {
    expect(defaultHomeHero.faith_story_steps).toHaveLength(6);
    expect(defaultHomeHero.faith_story_steps.map((step) => step.title)).toEqual([
      "Begin met aandacht",
      "Bouw aan ritme",
      "Draag de last",
      "Erken de groei",
      "Voed je geest",
      "Ga met betekenis",
    ]);
  });

  it("accepts a future story of three to twelve CMS chapters", () => {
    const eightSteps = Array.from({ length: 8 }, (_, index) => ({
      ...defaultHomeHero.faith_story_steps[index % defaultHomeHero.faith_story_steps.length],
      title: `Verhaalstap ${index + 1}`,
    }));

    expect(homeHeroSchema.safeParse({ ...defaultHomeHero, faith_story_steps: eightSteps }).success).toBe(true);
    expect(homeHeroSchema.safeParse({ ...defaultHomeHero, faith_story_steps: eightSteps.slice(0, 2) }).success).toBe(false);
    expect(homeHeroSchema.safeParse({ ...defaultHomeHero, faith_story_steps: Array.from({ length: 13 }, () => eightSteps[0]) }).success).toBe(false);
  });

  it("parses the dynamic chapter count submitted by the CMS", () => {
    const result = homeHeroFromFormData(formDataForFaithSteps(7));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.faith_story_steps).toHaveLength(7);
    expect(result.data.faith_story_steps[6].title).toContain("7");
  });

  it("upgrades the former four-step story when loading an unversioned revision", () => {
    const legacy = { ...defaultHomeHero } as Record<string, unknown>;
    delete legacy.faith_story_layout_version;
    legacy.faith_story_steps = defaultHomeHero.faith_story_steps.slice(0, 4);

    const result = homeHeroSchema.parse(legacy);
    expect(result.faith_story_layout_version).toBe(2);
    expect(result.faith_story_steps).toHaveLength(6);
  });
});
