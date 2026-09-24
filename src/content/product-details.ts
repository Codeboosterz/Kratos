import type { Product } from "@/src/domain/products";

// Editorial facts approved by the 23 September 2026 client correction. Commercial
// inclusions beyond these basic service forms still require product-level approval.
export type ProductDetail = { audience: string; delivery: string; included: string[]; practical: string; mediaApproved: boolean };
export const productDetails: Record<string, ProductDetail> = {
  "transformatie-pack-10-sessies": { audience: "Voor wie persoonlijk met Omar wil trainen.", delivery: "Persoonlijke trainingssessies met Omar.", included: ["Persoonlijke trainingsbegeleiding"], practical: "Aantal sessies, locatie en planning worden bij de aanvraag bevestigd.", mediaApproved: true },
  "premium-online-coaching": { audience: "Voor wie begeleiding op afstand zoekt.", delivery: "Je traint zelfstandig en ontvangt begeleiding op afstand.", included: ["Online begeleiding", "Persoonlijke feedback"], practical: "Contactvorm en frequentie worden bij de aanvraag besproken.", mediaApproved: false },
  "training-voeding-bundle": { audience: "Voor wie training en voedingskeuzes samen wil bespreken.", delivery: "Een gecombineerd begeleidingstraject.", included: ["Training", "Voedingsbegeleiding"], practical: "De omvang van beide onderdelen wordt bij de aanvraag bevestigd.", mediaApproved: true },
  "duo-coaching": { audience: "Voor twee personen die samen willen trainen.", delivery: "Twee trainingspartners trainen onder begeleiding van Omar.", included: ["Training voor twee personen", "Begeleiding tijdens het trainen"], practical: "Sessies en prijs per persoon of duo worden bij de aanvraag bevestigd.", mediaApproved: false },
  "jouw-trainingsschema": { audience: "Voor wie zelfstandig met meer structuur wil trainen.", delivery: "Je volgt het programma zelfstandig.", included: ["Trainingsprogramma"], practical: "Levering en eventuele aanpassing worden voor de start uitgelegd.", mediaApproved: true },
  "hwo-beginners": { audience: "Voor beginners die thuis willen trainen.", delivery: "Je volgt het thuisprogramma zelfstandig.", included: ["Thuisprogramma voor beginners"], practical: "Duur en benodigd materiaal worden voor de start bevestigd.", mediaApproved: true },
  "hwo-lower-body-glutes": { audience: "Voor wie thuis gericht het onderlichaam wil trainen.", delivery: "Je volgt het thuisprogramma zelfstandig.", included: ["Thuisprogramma met focus op benen en billen"], practical: "Duur en benodigd materiaal worden voor de start bevestigd.", mediaApproved: true },
  "12-weken-transformatie": { audience: "Voor wie een afgebakend begeleidingstraject zoekt.", delivery: "Persoonlijke begeleiding binnen het gekozen traject.", included: ["Persoonlijke begeleiding"], practical: "Looptijd, contactvorm en inhoud worden bij de aanvraag bevestigd.", mediaApproved: true },
};
export const mediaApproved = (product: Product) => productDetails[product.slug]?.mediaApproved ?? false;
export const priceRequestHref = (slug: string) => `/intake?source=product-detail&product=${encodeURIComponent(slug)}&intent=price`;
export const canPurchase = (product: Product) => product.priceStatus === "verified" && Boolean(product.priceCents && product.priceUnit && product.stripePriceId && product.checkoutMode === "stripe_internal");
const unitLabels = { per_session: "per sessie", per_person: "per persoon", per_duo: "per duo", per_month: "per maand", per_package: "per pakket" } as const;
export function priceLabel(product: Product) {
  return canPurchase(product) && product.priceCents && product.priceUnit
    ? `${new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(product.priceCents / 100)} ${unitLabels[product.priceUnit]}`
    : "Prijs op aanvraag";
}
