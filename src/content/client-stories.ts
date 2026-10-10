export const previousReviewsIntro = "Deze ruimte is klaar voor goedgekeurde cliëntverhalen. Namen, beelden en resultaten worden pas gepubliceerd na toestemming.";
export const reviewsIntro = "Twee persoonlijke trajecten, twee verschillende startpunten. Dit zijn hun resultaten en ervaringen. Resultaten verschillen per persoon.";

export const previousReviewCards = Array.from({ length: 4 }, (_, index) => ({
  label: `Cliëntverhaal ${String(index + 1).padStart(2, "0")}`,
  title: "Verhaal in voorbereiding",
  text: "Hier verschijnt een gecontroleerd verhaal met context, toestemming en passend beeld.",
}));

export const clientStoryCards = [
  {
    label: "Cliëntverhaal 01",
    image_url: "/images/client-stories/story-01.jpg",
    image_alt: "Voor en na: 86,5 kg en 23% vet naar 80,2 kg en 17% vet.",
    title: "Van 86,5 naar 80,2 kg",
    text: "Deze cliënt ging van 86,5 naar 80,2 kg. Het vetpercentage daalde van 23% naar 17%: 6,3 kg minder en een daling van 6 procentpunten in vetpercentage.",
  },
  {
    label: "Cliëntverhaal 02",
    image_url: "/images/client-stories/story-02.jpg",
    image_alt: "Voor en na: van 66 kg naar 60,9 kg in 12 weken.",
    title: "In 12 weken van 66 naar 60,9 kg",
    text: "Dankzij de persoonlijke begeleiding van KRATOS verloor ik 5,1 kg en werd ik bewuster van mijn training en voeding. Ik voel me fitter, sterker en beter in mijn vel. De motivatie hielp me ook op moeilijke momenten. Mijn volgende doel: spiermassa opbouwen.",
  },
  ...previousReviewCards.slice(2),
];

export function upgradeClientStories(cards: unknown): unknown {
  if (!Array.isArray(cards)) return cards;
  return cards.map((card, index) => {
    const previous = previousReviewCards[index];
    return index < 2 && card && typeof card === "object"
      && card.label === previous.label && card.title === previous.title && card.text === previous.text
      ? { ...card, ...clientStoryCards[index] } : card;
  });
}
