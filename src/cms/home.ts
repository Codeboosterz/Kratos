import "server-only";

import { z } from "zod";
import { isSupabaseConfigured } from "@/src/supabase/config";
import { createPublicClient } from "@/src/supabase/public";

const internalHref = z.string().trim().min(1).max(240).refine((value) => value.startsWith("/"), {
  message: "Gebruik een intern pad dat met / begint.",
});

const safeImageUrl = z.string().trim().min(1).max(1000).refine((value) => {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}, { message: "Kies een beeld uit de mediabibliotheek of gebruik een intern pad." });

const faithStoryStepSchema = z.object({
  title: z.string().trim().min(2).max(80),
  text: z.string().trim().min(20).max(420),
  image_url: safeImageUrl,
  image_alt: z.string().trim().max(240).default(""),
});

const defaultFaithStorySteps = [
  {
    title: "Begin met aandacht",
    text: "Geloof en discipline beginnen bij eerlijk stilstaan: waar je bent, wat je draagt en waar je naartoe wilt.",
    image_url: "/images/faith/01-prayer.webp",
    image_alt: "Omar knielt in stilte op een trainingsmat in de gym.",
  },
  {
    title: "Bouw aan ritme",
    text: "Training wordt een bewust moment in je week — een ritme dat je lichaam versterkt en je hoofd tot rust brengt.",
    image_url: "/images/omar-cable.jpg",
    image_alt: "Omar traint geconcentreerd met een kabeltoestel.",
  },
  {
    title: "Draag de last",
    text: "Kracht vraagt discipline. Geloof geeft richting. Elke herhaling leert je blijven staan wanneer het zwaar wordt.",
    image_url: "/images/omar-deadlift.jpg",
    image_alt: "Omar staat klaar voor een zware deadlift in de gym.",
  },
  {
    title: "Erken de groei",
    text: "Sta bewust stil bij wat verandert. Dankbaarheid maakt vooruitgang zichtbaar, ook wanneer die nog klein voelt.",
    image_url: "/images/faith/04-gratitude.webp",
    image_alt: "Omar staat met zijn hand op zijn hart tussen de gewichten.",
  },
  {
    title: "Voed je geest",
    text: "Wat je aandacht geeft, groeit. Maak naast training ruimte voor reflectie, wijsheid en een helder kompas.",
    image_url: "/images/faith/05-reflection.webp",
    image_alt: "Omar leest en reflecteert rustig op een trainingsbank.",
  },
  {
    title: "Ga met betekenis",
    text: "Het doel is meer dan sterker worden: bewegen met richting, leven met overtuiging en vooruitgaan met betekenis.",
    image_url: "/images/faith/06-purpose.webp",
    image_alt: "Omar kijkt na zijn training in stilte naar het licht buiten.",
  },
] as const;

const reviewCardSchema = z.object({
  label: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(100),
  text: z.string().trim().min(20).max(420),
});

const communityImageDefaults = [
  "/images/omar-cable.jpg", "/images/omar-deadlift.jpg", "/images/omar-hydrate.jpg",
  "/img/hero-header.jpg", "/img/omar.jpg", "/img/omar-portrait.jpg",
  "/media/programs/05-duo-coaching.jpg", "/images/omar-cable.jpg",
  "/media/programs/02-training-voeding-bundle.jpg", "/media/programs/04-transformation-pack-10-sessions.jpg",
  "/media/programs/03-premium-online-coaching.jpg", "/media/programs/06-hwo-beginners-room.jpg",
  "/media/programs/07-hwo-lower-body-glutes.jpg", "/media/programs/09-12-week-transformation.jpg",
  "/images/omar-cable.jpg",
] as const;

const homeHeroObjectSchema = z.object({
  eyebrow: z.string().trim().min(2).max(80),
  title_line_1: z.string().trim().min(1).max(40),
  title_line_1_accent: z.string().trim().min(1).max(40),
  title_line_2: z.string().trim().min(1).max(40),
  title_line_2_accent: z.string().trim().min(1).max(40),
  intro: z.string().trim().min(20).max(240),
  primary_cta_label: z.string().trim().min(2).max(50),
  primary_cta_href: internalHref,
  secondary_cta_label: z.string().trim().min(2).max(50),
  secondary_cta_href: internalHref,
  note: z.string().trim().min(2).max(160),
  hero_image_url: safeImageUrl,
  hero_image_alt: z.string().trim().max(240),
  marquee_primary: z.string().trim().min(2).max(80).default("Reach your full potential"),
  marquee_secondary: z.string().trim().min(2).max(80).default("Unleash your power"),
  mission_eyebrow: z.string().trim().min(2).max(80).default("Persoonlijke coaching"),
  mission_title: z.string().trim().min(2).max(100).default("Je hoeft het niet alleen te doen."),
  mission_text: z.string().trim().min(20).max(420).default("Kratos helpt je bouwen aan fysieke en mentale groei met persoonlijke begeleiding, een helder plan en aandacht voor een ritme dat bij jouw leven past."),
  mission_image_url: safeImageUrl.default("/images/omar-deadlift.jpg"),
  faith_eyebrow: z.string().trim().min(2).max(80).default("Meer dan training"),
  faith_title: z.string().trim().min(2).max(100).default("Faith & Fitness."),
  faith_subtitle: z.string().trim().min(2).max(140).default("Sterk in lichaam. Geworteld in geloof."),
  faith_text: z.string().trim().min(20).max(420).default("Voor wie geloof onderdeel is van het dagelijks leven, kan coaching ruimte bieden voor discipline, reflectie en persoonlijke groei."),
  faith_image_url: safeImageUrl.default("/images/omar-hydrate.jpg"),
  faith_story_layout_version: z.literal(2).default(2),
  faith_story_steps: z.array(faithStoryStepSchema).min(3).max(12).default(defaultFaithStorySteps.map((step) => ({ ...step }))),
  omar_eyebrow: z.string().trim().min(2).max(80).default("Aandacht vóór actie"),
  omar_word: z.string().trim().min(1).max(12).default("mar"),
  omar_title: z.string().trim().min(2).max(100).default("Coaching begint bij jouw startpunt."),
  omar_text: z.string().trim().min(20).max(420).default("Omar luistert naar je doel, ervaring en dagelijkse context. Vanuit daar ontstaat een route die duidelijk, persoonlijk en haalbaar is."),
  omar_image_url: safeImageUrl.default("/images/omar-cable.jpg"),
  community_image_urls: z.array(safeImageUrl).length(15).default([...communityImageDefaults]),
  reviews_eyebrow: z.string().trim().min(2).max(80).default("Ervaringen"),
  reviews_title: z.string().trim().min(2).max(100).default("Niet onze woorden."),
  reviews_title_accent: z.string().trim().min(2).max(80).default("Die van hen."),
  reviews_intro: z.string().trim().min(20).max(420).default("Deze ruimte is klaar voor goedgekeurde cliëntverhalen. Namen, beelden en resultaten worden pas gepubliceerd na toestemming."),
  review_cards: z.array(reviewCardSchema).length(4).default(Array.from({ length: 4 }, (_, index) => ({
    label: `Cliëntverhaal ${String(index + 1).padStart(2, "0")}`,
    title: "Verhaal in voorbereiding",
    text: "Hier verschijnt een gecontroleerd verhaal met context, toestemming en passend beeld.",
  }))),
  directions_eyebrow: z.string().trim().min(2).max(80).default("Kies jouw richting"),
  directions_title: z.string().trim().min(2).max(100).default("Waar wil je aan"),
  directions_title_accent: z.string().trim().min(2).max(80).default("werken?"),
  final_cta_title: z.string().trim().min(2).max(100).default("Klaar om te beginnen?"),
  final_cta_text: z.string().trim().min(2).max(180).default("Plan je intake en zet de eerste stap."),
  motion_hero_accents: z.enum(["slide", "none"]).default("slide"),
  motion_goal_cards: z.enum(["blink", "none"]).default("blink"),
  motion_method_line_1: z.enum(["typewriter", "none"]).default("typewriter"),
  motion_method_line_2: z.enum(["slide_up", "none"]).default("slide_up"),
  motion_results_accents: z.enum(["slide", "none"]).default("slide"),
  motion_client_stories: z.enum(["scroll", "none"]).default("scroll"),
});

export const homeHeroSchema = z.preprocess((input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const content = input as Record<string, unknown>;
  if (content.faith_story_layout_version !== undefined) return input;

  return {
    ...content,
    faith_story_layout_version: 2,
    faith_story_steps: defaultFaithStorySteps.map((step) => ({ ...step })),
  };
}, homeHeroObjectSchema);

export type HomeHeroContent = z.infer<typeof homeHeroSchema>;

export const defaultHomeHero: HomeHeroContent = {
  eyebrow: "Persoonlijke coaching",
  title_line_1: "Word",
  title_line_1_accent: "sterker.",
  title_line_2: "Blijf",
  title_line_2_accent: "sterker.",
  intro: "Training en coaching met een helder plan dat past bij jouw doel, niveau en dagelijks leven.",
  primary_cta_label: "Plan een intake",
  primary_cta_href: "/intake?source=home-hero",
  secondary_cta_label: "Bekijk onze werkwijze",
  secondary_cta_href: "/resultaten",
  note: "Eerst jouw startpunt en doel helder krijgen.",
  hero_image_url: "/img/hero-header.jpg",
  hero_image_alt: "",
  marquee_primary: "Reach your full potential",
  marquee_secondary: "Unleash your power",
  mission_eyebrow: "Persoonlijke coaching",
  mission_title: "Je hoeft het niet alleen te doen.",
  mission_text: "Kratos helpt je bouwen aan fysieke en mentale groei met persoonlijke begeleiding, een helder plan en aandacht voor een ritme dat bij jouw leven past.",
  mission_image_url: "/images/omar-deadlift.jpg",
  faith_eyebrow: "Meer dan training",
  faith_title: "Faith & Fitness.",
  faith_subtitle: "Sterk in lichaam. Geworteld in geloof.",
  faith_text: "Voor wie geloof onderdeel is van het dagelijks leven, kan coaching ruimte bieden voor discipline, reflectie en persoonlijke groei.",
  faith_image_url: "/images/omar-hydrate.jpg",
  faith_story_layout_version: 2,
  faith_story_steps: defaultFaithStorySteps.map((step) => ({ ...step })),
  omar_eyebrow: "Aandacht vóór actie",
  omar_word: "mar",
  omar_title: "Coaching begint bij jouw startpunt.",
  omar_text: "Omar luistert naar je doel, ervaring en dagelijkse context. Vanuit daar ontstaat een route die duidelijk, persoonlijk en haalbaar is.",
  omar_image_url: "/images/omar-cable.jpg",
  community_image_urls: [...communityImageDefaults],
  reviews_eyebrow: "Ervaringen",
  reviews_title: "Niet onze woorden.",
  reviews_title_accent: "Die van hen.",
  reviews_intro: "Deze ruimte is klaar voor goedgekeurde cliëntverhalen. Namen, beelden en resultaten worden pas gepubliceerd na toestemming.",
  review_cards: Array.from({ length: 4 }, (_, index) => ({ label: `Cliëntverhaal ${String(index + 1).padStart(2, "0")}`, title: "Verhaal in voorbereiding", text: "Hier verschijnt een gecontroleerd verhaal met context, toestemming en passend beeld." })),
  directions_eyebrow: "Kies jouw richting",
  directions_title: "Waar wil je aan",
  directions_title_accent: "werken?",
  final_cta_title: "Klaar om te beginnen?",
  final_cta_text: "Plan je intake en zet de eerste stap.",
  motion_hero_accents: "slide",
  motion_goal_cards: "blink",
  motion_method_line_1: "typewriter",
  motion_method_line_2: "slide_up",
  motion_results_accents: "slide",
  motion_client_stories: "scroll",
};

export async function getPublishedHomeHero(): Promise<HomeHeroContent> {
  if (!isSupabaseConfigured()) return defaultHomeHero;

  try {
    const supabase = createPublicClient();
    const { data: page, error: pageError } = await supabase
      .from("content_pages")
      .select("published_revision_id")
      .eq("slug", "home")
      .maybeSingle();

    if (pageError || !page?.published_revision_id) return defaultHomeHero;

    const { data: revision, error: revisionError } = await supabase
      .from("content_revisions")
      .select("content")
      .eq("id", page.published_revision_id)
      .maybeSingle();

    if (revisionError || !revision) return defaultHomeHero;
    const parsed = homeHeroSchema.safeParse(revision.content);
    return parsed.success ? parsed.data : defaultHomeHero;
  } catch {
    return defaultHomeHero;
  }
}

export function homeHeroFromFormData(formData: FormData) {
  const requestedFaithStepCount = Number(formData.get("faith_story_step_count"));
  const faithStepCount = Number.isSafeInteger(requestedFaithStepCount)
    ? Math.min(Math.max(requestedFaithStepCount, 0), 13)
    : 0;

  return homeHeroSchema.safeParse({
    eyebrow: formData.get("eyebrow"),
    title_line_1: formData.get("title_line_1"),
    title_line_1_accent: formData.get("title_line_1_accent"),
    title_line_2: formData.get("title_line_2"),
    title_line_2_accent: formData.get("title_line_2_accent"),
    intro: formData.get("intro"),
    primary_cta_label: formData.get("primary_cta_label"),
    primary_cta_href: formData.get("primary_cta_href"),
    secondary_cta_label: formData.get("secondary_cta_label"),
    secondary_cta_href: formData.get("secondary_cta_href"),
    note: formData.get("note"),
    hero_image_url: formData.get("hero_image_url"),
    hero_image_alt: formData.get("hero_image_alt"),
    marquee_primary: formData.get("marquee_primary"),
    marquee_secondary: formData.get("marquee_secondary"),
    mission_eyebrow: formData.get("mission_eyebrow"),
    mission_title: formData.get("mission_title"),
    mission_text: formData.get("mission_text"),
    mission_image_url: formData.get("mission_image_url"),
    faith_eyebrow: formData.get("faith_eyebrow"),
    faith_title: formData.get("faith_title"),
    faith_subtitle: formData.get("faith_subtitle"),
    faith_text: formData.get("faith_text"),
    faith_image_url: formData.get("faith_image_url"),
    faith_story_layout_version: Number(formData.get("faith_story_layout_version")),
    faith_story_steps: Array.from({ length: faithStepCount }, (_, index) => ({
      title: formData.get(`faith_story_${index}_title`),
      text: formData.get(`faith_story_${index}_text`),
      image_url: formData.get(`faith_story_${index}_image_url`),
      image_alt: formData.get(`faith_story_${index}_image_alt`),
    })),
    omar_eyebrow: formData.get("omar_eyebrow"),
    omar_word: formData.get("omar_word"),
    omar_title: formData.get("omar_title"),
    omar_text: formData.get("omar_text"),
    omar_image_url: formData.get("omar_image_url"),
    community_image_urls: Array.from({ length: 15 }, (_, index) => formData.get(`community_image_url_${index}`)),
    reviews_eyebrow: formData.get("reviews_eyebrow"),
    reviews_title: formData.get("reviews_title"),
    reviews_title_accent: formData.get("reviews_title_accent"),
    reviews_intro: formData.get("reviews_intro"),
    review_cards: Array.from({ length: 4 }, (_, index) => ({
      label: formData.get(`review_${index}_label`),
      title: formData.get(`review_${index}_title`),
      text: formData.get(`review_${index}_text`),
    })),
    directions_eyebrow: formData.get("directions_eyebrow"),
    directions_title: formData.get("directions_title"),
    directions_title_accent: formData.get("directions_title_accent"),
    final_cta_title: formData.get("final_cta_title"),
    final_cta_text: formData.get("final_cta_text"),
    motion_hero_accents: formData.get("motion_hero_accents"),
    motion_goal_cards: formData.get("motion_goal_cards"),
    motion_method_line_1: formData.get("motion_method_line_1"),
    motion_method_line_2: formData.get("motion_method_line_2"),
    motion_results_accents: formData.get("motion_results_accents"),
    motion_client_stories: formData.get("motion_client_stories"),
  });
}
