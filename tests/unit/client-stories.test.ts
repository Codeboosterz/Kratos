import { describe, expect, it } from "vitest";
import { defaultHomeHero, homeHeroSchema } from "@/src/cms/home";
import { visibleReviewCards } from "@/src/domain/review-cards";

const placeholders = Array.from({ length: 4 }, (_, index) => ({
  label: `Cliëntverhaal ${String(index + 1).padStart(2, "0")}`,
  title: "Verhaal in voorbereiding",
  text: "Hier verschijnt een gecontroleerd verhaal met context, toestemming en passend beeld.",
}));

describe("supplied client stories", () => {
  it("shows two factual stories and hides unfilled slots", () => {
    const cards = visibleReviewCards(defaultHomeHero.review_cards);
    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.image_url)).toEqual(["/images/client-stories/story-01.jpg", "/images/client-stories/story-02.jpg"]);
    expect(cards[0].title).toBe("Van 86,5 naar 80,2 kg");
    expect(cards[0].text).toContain("23% naar 17%");
    expect(cards[1].title).toBe("In 12 weken van 66 naar 60,9 kg");
    expect(cards[1].text.length).toBeLessThan(350);
    expect(cards[1].text).toContain("spiermassa opbouwen");
  });

  it("upgrades only exact legacy placeholders in the first two positions", () => {
    const result = homeHeroSchema.parse({ ...defaultHomeHero, review_cards: placeholders });
    expect(result.review_cards.slice(0, 2)).toEqual(defaultHomeHero.review_cards.slice(0, 2));
    expect(result.review_cards.slice(2)).toEqual(placeholders.slice(2));
    const custom = { ...placeholders[0], text: "Deze eigen CMS-tekst moet altijd bewaard blijven." };
    expect(homeHeroSchema.parse({ ...defaultHomeHero, review_cards: [custom, ...placeholders.slice(1)] }).review_cards[0]).toEqual(custom);
  });
});
