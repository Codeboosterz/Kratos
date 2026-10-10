type ReviewCard = { label: string; title: string; text: string };

/** Published CMS stories remain unchanged; setup placeholders are not proof. */
export function visibleReviewCards<T extends ReviewCard>(cards: readonly T[]): T[] {
  return cards.filter((card) => card.title.trim().toLocaleLowerCase("nl-BE") !== "verhaal in voorbereiding");
}
