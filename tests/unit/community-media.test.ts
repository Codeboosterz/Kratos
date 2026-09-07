import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultHomeHero, homeHeroSchema } from "@/src/cms/home";

const legacyImages = [
  "/images/omar-cable.jpg", "/images/omar-deadlift.jpg", "/images/omar-hydrate.jpg",
  "/img/hero-header.jpg", "/img/omar.jpg", "/img/omar-portrait.jpg",
  "/media/programs/05-duo-coaching.jpg", "/images/omar-cable.jpg",
  "/media/programs/02-training-voeding-bundle.jpg", "/media/programs/04-transformation-pack-10-sessions.jpg",
  "/media/programs/03-premium-online-coaching.jpg", "/media/programs/06-hwo-beginners-room.jpg",
  "/media/programs/07-hwo-lower-body-glutes.jpg", "/media/programs/09-12-week-transformation.jpg",
  "/images/omar-cable.jpg",
];

describe("community photo refresh", () => {
  it("fills all 14 surrounding slots with unique local community photos", () => {
    const images = defaultHomeHero.community_image_urls.filter((_, index) => index !== 7);
    expect(images).toHaveLength(14);
    expect(new Set(images).size).toBe(14);
    for (const image of images) {
      expect(image).toMatch(/^\/images\/community\/.+\.jpg$/);
      expect(existsSync(resolve(process.cwd(), `public${image}`))).toBe(true);
    }
    expect(defaultHomeHero.mission_image_url).toBe("/images/omar-deadlift.jpg");
  });

  it("upgrades only the legacy default array without replacing the chosen centre or copy", () => {
    const result = homeHeroSchema.parse({
      ...defaultHomeHero, community_image_urls: legacyImages,
      mission_image_url: "/images/custom-centre.jpg", mission_title: "Onze community",
    });
    expect(result.community_image_urls).toEqual(defaultHomeHero.community_image_urls);
    expect(result.community_image_urls).not.toEqual(legacyImages);
    expect(result.mission_image_url).toBe("/images/custom-centre.jpg");
    expect(result.mission_title).toBe("Onze community");
  });

  it("preserves custom CMS selections and rejects missing slots", () => {
    const customised = [...legacyImages];
    customised[0] = "/images/client-selected.jpg";
    expect(homeHeroSchema.parse({ ...defaultHomeHero, community_image_urls: customised }).community_image_urls).toEqual(customised);
    expect(homeHeroSchema.safeParse({ ...defaultHomeHero, community_image_urls: customised.slice(0, 12) }).success).toBe(false);
  });

  it("uses a container-capped 2.5% base enlargement and image-specific focal points", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const component = readFileSync(resolve(process.cwd(), "components/editorial-motion.tsx"), "utf8");
    expect(styles).toContain("--community-grid-growth: 1.025");
    expect(styles).toContain("calc(1180px * var(--community-grid-growth))");
    expect(component).toContain("getCommunityImagePosition(src)");
  });
});
