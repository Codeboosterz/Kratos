export const productCategories = [
  "personal_training",
  "online",
  "bundle",
  "duo",
  "digital_program",
  "home_workout",
  "transformation",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const goalKeys = ["afvallen", "spieropbouw", "fit-sterk"] as const;
export type GoalKey = (typeof goalKeys)[number];

export const categoryFilters = [
  "alle",
  "personal_training",
  "online",
  "bundle",
  "duo",
  "digital_program",
  "home_workout",
  "transformation",
] as const;
export type CategoryFilter = (typeof categoryFilters)[number];

export type PriceStatus = "verification_required" | "verified" | "archived";
export type CheckoutMode = "trainerize_external" | "stripe_internal" | "disabled";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  format: string;
  summary: string;
  highlights: [string, string, string];
  goalKeys: GoalKey[];
  priceCents: number | null;
  priceStatus: PriceStatus;
  checkoutMode: CheckoutMode;
  trainerizePlanId: string | null;
  stripePriceId: string | null;
  active: boolean;
  featured: boolean;
  image: string;
  imageAlt: string;
};

export const categoryLabels: Record<CategoryFilter, string> = {
  alle: "Alle trajecten",
  personal_training: "Personal training",
  online: "Online",
  bundle: "Training + voeding",
  duo: "Duo",
  digital_program: "Trainingsschema's",
  home_workout: "Home workouts",
  transformation: "Transformatie",
};

export const goalLabels: Record<GoalKey, string> = {
  afvallen: "Afvallen",
  spieropbouw: "Spieropbouw",
  "fit-sterk": "Fit & sterk",
};
