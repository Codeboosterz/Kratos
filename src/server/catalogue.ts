import "server-only";
import { z } from "zod";
import productConfig from "@/config/products.json";
import {
  categoryFilters,
  goalKeys,
  productCategories,
  type CategoryFilter,
  type GoalKey,
  type Product,
} from "@/src/domain/products";

const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  category: z.enum(productCategories),
  format: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.tuple([
    z.string().min(1).max(48),
    z.string().min(1).max(48),
    z.string().min(1).max(48),
  ]),
  goalKeys: z.array(z.enum(goalKeys)).min(1),
  priceCents: z.number().int().positive().nullable(),
  priceStatus: z.enum(["verification_required", "verified", "archived"]),
  checkoutMode: z.enum(["trainerize_external", "stripe_internal", "disabled"]),
  trainerizePlanId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
  image: z.string().startsWith("/"),
  imageAlt: z.string().min(1).max(180),
});

const parsed = z.object({ products: z.array(productSchema) }).parse(productConfig);
const products = parsed.products as Product[];

if (new Set(products.map((product) => product.slug)).size !== products.length) {
  throw new Error("Product slugs must be unique.");
}

const legacyProductImages: Record<string, string> = {
  "transformatie-pack-10-sessies": "/media/programs/cards/transformation-pack-hero-v2.jpg",
  "premium-online-coaching": "/media/programs/cards/premium-online-coaching-hero-v2.jpg",
  "training-voeding-bundle": "/media/programs/cards/training-voeding-bundle-hero-v2.jpg",
  "duo-coaching": "/media/programs/05-duo-coaching.jpg",
  "jouw-trainingsschema": "/media/programs/01-training-schema.jpg",
  "hwo-beginners": "/media/programs/06-hwo-beginners-room.jpg",
  "hwo-lower-body-glutes": "/media/programs/07-hwo-lower-body-glutes.jpg",
  "12-weken-transformatie": "/media/programs/09-12-week-transformation.jpg",
};

const legacyProductSummaries: Record<string, string> = {
  "transformatie-pack-10-sessies": "Een persoonlijk traject rond training, ritme en voortgang.",
  "premium-online-coaching": "Structuur en persoonlijke afstemming, waar je ook traint.",
  "training-voeding-bundle": "Een samenhangende aanpak voor training en dagelijkse keuzes.",
  "duo-coaching": "Een begeleid traject voor twee trainingspartners.",
  "jouw-trainingsschema": "Een heldere trainingsstructuur die aansluit op je doel.",
  "hwo-beginners": "Een toegankelijke basis om thuis gericht te leren trainen.",
  "hwo-lower-body-glutes": "Een thuisprogramma met focus op het onderlichaam.",
  "12-weken-transformatie": "Een traject met een duidelijke periode en persoonlijke start.",
};

export function getProducts(): Product[] {
  return products.filter((product) => product.active);
}

export function getFeaturedProducts(): Product[] {
  return getProducts().filter((product) => product.featured);
}

export function getProduct(slug: string): Product | null {
  return products.find((product) => product.slug === slug && product.active) ?? null;
}

export function normalizeCategory(value: string | string[] | undefined): CategoryFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return categoryFilters.includes(raw as CategoryFilter) ? (raw as CategoryFilter) : "alle";
}

export function normalizeGoal(value: string | string[] | undefined): GoalKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return goalKeys.includes(raw as GoalKey) ? (raw as GoalKey) : null;
}

export function filterProducts(category: CategoryFilter, goal: GoalKey | null): Product[] {
  return getProducts().filter((product) => {
    const categoryMatches = category === "alle" || product.category === category;
    const goalMatches = !goal || product.goalKeys.includes(goal);
    return categoryMatches && goalMatches;
  });
}

export function applyCmsProductPresentation(product: Product, content: Record<string, string>): Product {
  const key = product.slug.replaceAll("-", "_");
  const cmsImage = content[`product_${key}_image_url`]?.trim();
  const image = cmsImage && cmsImage !== legacyProductImages[product.slug]
    ? cmsImage
    : product.image;
  const cmsSummary = content[`product_${key}_summary`]?.trim();
  const summary = cmsSummary && cmsSummary !== legacyProductSummaries[product.slug]
    ? cmsSummary
    : product.summary;
  return {
    ...product,
    name: content[`product_${key}_name`] || product.name,
    format: content[`product_${key}_format`] || product.format,
    summary,
    highlights: product.highlights.map((highlight, index) => (
      content[`product_${key}_highlight_${index + 1}`] || highlight
    )) as Product["highlights"],
    image,
    imageAlt: content[`product_${key}_image_alt`] || product.imageAlt,
  };
}
