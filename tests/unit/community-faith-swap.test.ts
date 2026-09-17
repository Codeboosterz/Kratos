import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultHomeHero, homeHeroSchema } from "@/src/cms/home";

const oldSurrounding = ["partner-stretch", "medicine-ball", "coach-guidance", "team-lunges", "stretch-smile", "outdoor-warmup", "coached-row", "team-recovery", "outdoor-lunge", "overhead-stretch", "agility-drill", "coach-focus", "partner-mobility", "coached-press"].map((name) => `/images/community/${name}.jpg`);
const oldGrid = [...oldSurrounding.slice(0, 7), "/images/omar-deadlift.jpg", ...oldSurrounding.slice(7)];
const oldFaith = ["/images/faith/01-prayer.webp", "/images/omar-cable.jpg", "/images/omar-deadlift.jpg", "/images/faith/04-gratitude.webp", "/images/faith/05-reflection.webp", "/images/faith/06-purpose.webp"];

describe("client photo placement", () => {
  it("uses 14 new gym originals around the unchanged centre", () => {
    const images = defaultHomeHero.community_image_urls;
    expect(images[7]).toBe("/images/omar-deadlift.jpg");
    const surrounding = images.filter((_, index) => index !== 7);
    expect(new Set(surrounding).size).toBe(14);
    for (const src of surrounding) {
      expect(src).toMatch(/^\/images\/community\/gym\/.+\.jpg$/);
      expect(existsSync(resolve(process.cwd(), `public${src}`))).toBe(true);
    }
  });

  it("moves precisely the 13 eligible old photos into six chapters", () => {
    const photos = defaultHomeHero.faith_story_steps.flatMap((step) => [step.image_url, ...(step.additional_images ?? []).map((photo: { image_url: string }) => photo.image_url)]);
    expect(photos).toEqual(oldGrid.filter((_, index) => index !== 6 && index !== 7));
    expect(new Set(photos).size).toBe(13);
    photos.forEach((src) => expect(existsSync(resolve(process.cwd(), `public${src}`))).toBe(true));
  });

  it("migrates the prior defaults once, retaining chapter copy and centre", () => {
    const oldSteps = defaultHomeHero.faith_story_steps.map((step, index) => ({ title: `${step.title}!`, text: step.text, image_url: oldFaith[index], image_alt: "Oud beeld" }));
    const result = homeHeroSchema.parse({ ...defaultHomeHero, community_image_urls: oldGrid, mission_image_url: "/images/chosen-centre.jpg", faith_story_steps: oldSteps });
    expect(result.community_image_urls).toEqual(defaultHomeHero.community_image_urls);
    expect(result.mission_image_url).toBe("/images/chosen-centre.jpg");
    expect(result.faith_story_steps.map((step) => step.title)).toEqual(oldSteps.map((step) => step.title));
    expect(result.faith_story_steps.map((step) => step.image_url)).toEqual(defaultHomeHero.faith_story_steps.map((step) => step.image_url));
    expect(homeHeroSchema.parse(result)).toEqual(result);
  });

  it("does not replace custom photo selections", () => {
    const grid = [...oldGrid]; grid[0] = "/images/custom.jpg";
    const steps = defaultHomeHero.faith_story_steps.map((step, index) => ({ ...step, image_url: oldFaith[index], additional_images: [] }));
    const result = homeHeroSchema.parse({ ...defaultHomeHero, community_image_urls: grid, faith_story_steps: steps });
    expect(result.community_image_urls).toEqual(grid);
    expect(result.faith_story_steps).toEqual(steps);
  });
});
