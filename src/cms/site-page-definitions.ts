import { z } from "zod";
import productConfig from "@/config/products.json";

export type CmsFieldDefinition = {
  key: string;
  label: string;
  section: string;
  kind: "text" | "textarea" | "image";
  defaultValue: string;
  maxLength?: number;
  help?: string;
};

export type CmsPageDefinition = {
  slug: string;
  route: string;
  title: string;
  description: string;
  fields: CmsFieldDefinition[];
};

const field = (section: string, key: string, label: string, defaultValue: string, kind: CmsFieldDefinition["kind"] = "text", maxLength?: number): CmsFieldDefinition => ({ section, key, label, defaultValue, kind, maxLength });
const hero = (eyebrow: string, title: string, accent: string, intro: string, image: string) => [
  field("Hero", "hero_eyebrow", "Bovenregel", eyebrow),
  field("Hero", "hero_title", "Titel", title),
  field("Hero", "hero_accent", "Groen deel", accent),
  field("Hero", "hero_intro", "Introductie", intro, "textarea", 420),
  field("Hero", "hero_image_url", "Hero-afbeelding", image, "image"),
  field("Hero", "hero_image_alt", "Beeldbeschrijving", "", "text", 240),
];

const resultsFields: CmsFieldDefinition[] = [
  ...hero("Persoonlijke coaching", "Resultaat begint met", "een eerlijk startpunt.", "Een helder beeld, relevante signalen en een route die aansluit op jouw leven.", "/images/omar-cable.jpg"),
  field("Hero", "hero_check_1", "Punt 1", "Een helder beeld van waar je nu staat"), field("Hero", "hero_check_2", "Punt 2", "Inzicht in wat werkt en wat je remt"), field("Hero", "hero_check_3", "Punt 3", "Een plan dat aansluit op jouw leven"),
  field("Voortgang", "method_eyebrow", "Bovenregel", "Jouw voortgang"), field("Voortgang", "method_title", "Titel", "Duidelijk volgen."), field("Voortgang", "method_accent", "Groen deel", "Bewust bijsturen."),
  ...[1,2,3].flatMap((n) => [field("Voortgang", `step_${n}_title`, `Stap ${n} — titel`, ["Startpunt","Check-in","Bijsturen"][n-1]), field("Voortgang", `step_${n}_text`, `Stap ${n} — tekst`, ["We brengen je huidige situatie in kaart met een intake, metingen en vragenlijst.","Regelmatige check-ins maken ruimte voor vragen, knelpunten en kleine overwinningen.","Op basis van context en feedback verfijnen we de route wanneer dat nodig is."][n-1], "textarea", 320)]),
  field("Context", "context_eyebrow", "Bovenregel", "Meten met betekenis"), field("Context", "context_title", "Titel", "Meten wat voor"), field("Context", "context_accent", "Groen deel", "jou relevant is."), field("Context", "context_image_url", "Afbeelding", "/images/omar-hydrate.jpg", "image"), field("Context", "context_image_alt", "Beeldbeschrijving", "Omar bespreekt een plan tijdens een coachingsmoment", "text", 240),
  ...[1,2,3].flatMap((n) => [field("Context", `principle_${n}_title`, `Principe ${n} — titel`, ["Focus op wat telt","Data met betekenis","Voortgang die blijft"][n-1]), field("Context", `principle_${n}_text`, `Principe ${n} — tekst`, ["We kiezen samen signalen die passen bij je doel en dagelijkse leven.","Cijfers zijn geen eindpunt; ze helpen om beslissingen begrijpelijk te maken.","Door te meten, leren en bij te sturen bouw je aan een aanpak die past."][n-1], "textarea", 300)]),
  field("Cliëntverhalen", "stories_eyebrow", "Bovenregel", "Verhalen van cliënten"), field("Cliëntverhalen", "stories_title", "Titel", "Echte verhalen verdienen"), field("Cliëntverhalen", "stories_accent", "Groen deel", "echte context."), field("Cliëntverhalen", "stories_intro", "Uitleg", "Deze scrollindeling is klaar voor gecontroleerde namen, beelden en ervaringen zodra toestemming en bronmateriaal bevestigd zijn.", "textarea", 420),
  ...[1,2,3,4].flatMap((n) => [field("Cliëntverhalen", `story_${n}_label`, `Verhaal ${n} — label`, `Cliëntverhaal ${String(n).padStart(2, "0")}`), field("Cliëntverhalen", `story_${n}_title`, `Verhaal ${n} — titel`, "Ruimte voor een goedgekeurd verhaal"), field("Cliëntverhalen", `story_${n}_text`, `Verhaal ${n} — tekst`, "Naam, beeld en review worden pas na toestemming en controle gepubliceerd.", "textarea", 360), field("Cliëntverhalen", `story_${n}_image_url`, `Verhaal ${n} — afbeelding`, ["/images/omar-deadlift.jpg","/images/omar-cable.jpg","/images/omar-hydrate.jpg","/img/hero-header.jpg"][n-1], "image")]),
  field("Laatste oproep", "final_title", "Titel", "Bespreek wat resultaat voor"), field("Laatste oproep", "final_accent", "Groen deel", "jou betekent."), field("Laatste oproep", "final_text", "Tekst", "Een intake maakt verwachtingen, mogelijkheden en een passende route helder.", "textarea", 320),
];

const methodFields: CmsFieldDefinition[] = [
  ...hero("Werkwijze", "Geen los schema.", "Wel een route.", "Een duidelijke aanpak die begint bij je startpunt en meebeweegt met je leven.", "/images/omar-deadlift.jpg"),
  field("Stappen", "steps_eyebrow", "Bovenregel", "Stap voor stap"), field("Stappen", "steps_line_1", "Typemachinezin", "Geen los schema."), field("Stappen", "steps_line_2", "Inschuivende zin", "Wel een duidelijke route."),
  ...[1,2,3,4].flatMap((n) => [field("Stappen", `step_${n}_title`, `Stap ${n} — titel`, ["Startpunt","Plan op maat","Uitvoering","Check-in"][n-1]), field("Stappen", `step_${n}_text`, `Stap ${n} — tekst`, ["We brengen doel, ervaring, voorkeuren en praktische context samen in kaart.","Je krijgt een logische richting die past bij je beschikbare tijd en gekozen vorm.","Training en begeleiding krijgen een duidelijke plek in je week.","We bespreken wat werkt, wat schuurt en waar bijsturing nodig is."][n-1], "textarea", 300)]),
  field("Basis", "basis_eyebrow", "Bovenregel", "De basis"), field("Basis", "basis_title", "Titel", "Duidelijk waar het moet."), field("Basis", "basis_accent", "Groen deel", "Persoonlijk waar het telt."),
  ...[1,2,3,4].flatMap((n) => [field("Basis", `feature_${n}_title`, `Kaart ${n} — titel`, ["Heldere afspraken","Persoonlijk contact","Bewuste voortgang","Bijsturen"][n-1]), field("Basis", `feature_${n}_text`, `Kaart ${n} — tekst`, ["Je weet wat de volgende stap is en waarom die past.","Vragen en voortgang krijgen een vaste plek.","We volgen relevante signalen zonder losse garanties.","De route kan veranderen wanneer je context verandert."][n-1], "textarea", 240)]),
  field("Laatste oproep", "final_eyebrow", "Bovenregel", "Begin bij jezelf"), field("Laatste oproep", "final_title", "Titel", "Jouw doel. Jouw ritme."), field("Laatste oproep", "final_accent", "Groen deel", "Jouw route."),
];

const catalogueFields: CmsFieldDefinition[] = [
  field("Hero", "hero_eyebrow", "Bovenregel", "Vind jouw traject"), field("Hero", "hero_title", "Titel", "Gebouwd rond"), field("Hero", "hero_accent", "Groen deel", "jouw doel."), field("Hero", "hero_intro", "Introductie", "Vergelijk persoonlijke training, online coaching en zelfstandige programma's op basis van wat nu bevestigd is.", "textarea", 420), field("Hero", "hero_cta", "Knoptekst", "Liever samen kiezen? Plan een intake"),
  field("Lege staat", "empty_title", "Titel", "Geen bevestigd aanbod in deze combinatie"), field("Lege staat", "empty_text", "Tekst", "We kunnen tijdens een intake bekijken welke route bij je doel past.", "textarea", 260),
  field("Laatste oproep", "final_eyebrow", "Bovenregel", "Nog niet zeker?"), field("Laatste oproep", "final_title", "Titel", "Kies niet alleen."), field("Laatste oproep", "final_accent", "Groen deel", "Kies bewust."), field("Laatste oproep", "final_text", "Tekst", "Leg je doel en voorkeuren voor. Daarna bespreken we welk traject logisch is.", "textarea", 320),
  field("Trajectdetail", "detail_benefits_eyebrow", "Bovenregel voordelen", "Dit krijg je"), field("Trajectdetail", "detail_benefits_title", "Titel voordelen", "Alles voor een"), field("Trajectdetail", "detail_benefits_accent", "Groen deel", "duidelijke route."),
  ...[1,2,3,4,5,6].flatMap((n) => [field("Trajectdetail", `benefit_${n}_title`, `Voordeel ${n} — titel`, ["Training op maat","Dagelijkse keuzes","Weekstructuur","Coaching","Voortgang","Verwachtingen"][n-1]), field("Trajectdetail", `benefit_${n}_text`, `Voordeel ${n} — tekst`, ["Afgestemd op doel, ervaring en beschikbare tijd.","Praktische begeleiding binnen wat voor dit traject bevestigd is.","Duidelijkheid over training, herstel en focus.","Ruimte voor vragen, feedback en afstemming.","Relevante signalen volgen en samen evalueren.","Geen losse garanties, wel een helder proces."][n-1], "textarea", 260)]),
  ...[1,2,3,4,5].flatMap((n) => [field("Trajectdetail", `detail_step_${n}_title`, `Processtap ${n} — titel`, ["Intake & analyse","Persoonlijk plan","Training & uitvoering","Check-in & feedback","Bijsturen & groeien"][n-1]), field("Trajectdetail", `detail_step_${n}_text`, `Processtap ${n} — tekst`, ["Doel, ervaring en startpunt in kaart.","Een structuur die aansluit op jouw week.","Gericht aan de slag met duidelijke focus.","Bespreken wat werkt en waar bijsturing nodig is.","De route verfijnen op basis van je voortgang."][n-1], "textarea", 240)]),
  field("Trajectdetail", "detail_coach_title", "Coach — titel", "Persoonlijk. Duidelijk."), field("Trajectdetail", "detail_coach_accent", "Coach — groen deel", "Betrokken."), field("Trajectdetail", "detail_coach_text", "Coach — tekst", "De begeleiding begint niet bij een standaard pakket, maar bij een gesprek over wat jij nodig hebt.", "textarea", 320), field("Trajectdetail", "detail_coach_image_url", "Coach — afbeelding", "/images/omar-cable.jpg", "image"),
  ...[1,2,3,4].flatMap((n) => [field("Trajectdetail", `faq_${n}_question`, `Vraag ${n}`, ["Voor wie is dit traject geschikt?","Hoe lang duurt het traject?","Hoe vaak heb ik contact?","Kan ik eerst kennismaken?"][n-1]), field("Trajectdetail", `faq_${n}_answer`, `Antwoord ${n}`, ["Tijdens de intake bekijken we of de vorm aansluit op je doel, ervaring en context.","De definitieve duur wordt samen met de inhoud en planning bevestigd.","De contactmomenten hangen af van de gekozen vorm en worden vóór de start vastgelegd.","Ja. De intake is het startpunt om verwachtingen en mogelijkheden te bespreken."][n-1], "textarea", 320)]),
  ...productConfig.products.flatMap((product) => {
    const key = product.slug.replaceAll("-", "_");
    const section = `Traject: ${product.name}`;
    return [
      field(section, `product_${key}_name`, "Naam", product.name),
      field(section, `product_${key}_format`, "Type", product.format),
      field(section, `product_${key}_summary`, "Beschrijving", product.summary, "textarea", 320),
      ...product.highlights.map((highlight, index) => (
        field(section, `product_${key}_highlight_${index + 1}`, `Kernpunt ${index + 1}`, highlight, "text", 48)
      )),
      field(section, `product_${key}_image_url`, "Afbeelding", product.image, "image"),
      field(section, `product_${key}_image_alt`, "Beeldbeschrijving", product.imageAlt, "text", 180),
    ];
  }),
];

const aboutFields: CmsFieldDefinition[] = [
  ...hero("Over Omar", "Aandacht", "vóór actie.", "Coaching begint met luisteren naar waar je nu staat, wat je wilt bereiken en wat in jouw leven werkt.", "/images/omar-cable.jpg"),
  ...[1,2,3].flatMap((n) => [field("Waarden", `value_${n}_title`, `Waarde ${n} — titel`, ["Luisteren","Richting","Eerlijkheid"][n-1]), field("Waarden", `value_${n}_text`, `Waarde ${n} — tekst`, ["Eerst begrijpen waar je staat en wat je nodig hebt.","Een plan dat klopt bij je doel en dagelijks leven.","Duidelijk, direct en altijd binnen wat bevestigd is."][n-1], "textarea", 240)]),
  field("Coaching", "coach_eyebrow", "Bovenregel", "Persoonlijke coaching"), field("Coaching", "coach_title", "Titel", "Coaching begint bij"), field("Coaching", "coach_accent", "Groen deel", "jouw startpunt."), field("Coaching", "coach_text", "Tekst", "Geen aannames. Geen standaard plan. We starten waar jij nu bent en bouwen samen verder.", "textarea", 360), field("Coaching", "coach_image_url", "Afbeelding", "/images/omar-deadlift.jpg", "image"),
  ...[1,2,3,4].flatMap((n) => [field("Werkwijze", `step_${n}_title`, `Stap ${n} — titel`, ["Startpunt","Plan op maat","Begeleiding","Evaluatie & groei"][n-1]), field("Werkwijze", `step_${n}_text`, `Stap ${n} — tekst`, ["We brengen je situatie, doel en uitdagingen in kaart.","We maken een persoonlijke route die past bij jouw leven.","Training, coaching en ondersteuning wanneer je die nodig hebt.","We meten, reflecteren en sturen bij voor blijvende vooruitgang."][n-1], "textarea", 280)]),
  field("Laatste oproep", "final_title", "Titel", "Begin met een helder gesprek."), field("Laatste oproep", "final_text", "Tekst", "Vertel waar jij aan wilt werken."),
];

const toolsFields: CmsFieldDefinition[] = [
  ...hero("Gratis tools", "Inzicht vraagt om", "de juiste context.", "Gebruik informatie als richting, met transparante beperkingen en zonder medisch advies te vervangen.", "/img/omar-portrait.jpg"),
  field("Hero", "hero_check_1", "Punt 1", "Betere keuzes met de juiste informatie"), field("Hero", "hero_check_2", "Punt 2", "Begrijp je startpunt en stuur bewust bij"), field("Hero", "hero_check_3", "Punt 3", "Geen ruis. Wel richting."),
  field("Tools", "tool_1_title", "Tool 1 — titel", "BMI-indicatie"), field("Tools", "tool_1_text", "Tool 1 — tekst", "Krijg straks inzicht in de verhouding tussen lengte en gewicht, met passende uitleg over wat BMI wel en niet zegt.", "textarea", 360), field("Tools", "tool_2_title", "Tool 2 — titel", "Caloriebehoefte"), field("Tools", "tool_2_text", "Tool 2 — tekst", "Bereken straks een dagelijkse indicatie op basis van doel en activiteit, met transparante aannames en bronvermelding.", "textarea", 360),
  field("Beperkingen", "limits_title", "Titel", "Context &"), field("Beperkingen", "limits_accent", "Groen deel", "limitaties."),
  ...[1,2,3].flatMap((n) => [field("Beperkingen", `limit_${n}_title`, `Punt ${n} — titel`, ["Geen medisch advies","Individueel verschil","Luister naar je lichaam"][n-1]), field("Beperkingen", `limit_${n}_text`, `Punt ${n} — tekst`, ["Deze tools zijn geen vervanging voor medisch advies, diagnose of behandeling.","Resultaten kunnen verschillen door leeftijd, geslacht, genetica en leefstijl.","Gebruik data als richting, maar neem je gevoel en herstel altijd serieus."][n-1], "textarea", 280)]),
  field("Laatste oproep", "final_title", "Titel", "Bespreek je doel in"), field("Laatste oproep", "final_accent", "Groen deel", "context."), field("Laatste oproep", "final_text", "Tekst", "Een tool vervangt geen persoonlijk gesprek of professioneel medisch advies.", "textarea", 280),
];

const intakeFields: CmsFieldDefinition[] = [
  field("Introductie", "hero_eyebrow", "Bovenregel", "Persoonlijke intake"), field("Introductie", "hero_title", "Titel", "Vertel ons"), field("Introductie", "hero_accent", "Groen deel", "waar je naartoe wilt."), field("Introductie", "hero_intro", "Introductie", "In vier overzichtelijke stappen bereiden we een passend eerste gesprek én je afspraak voor.", "textarea", 360), field("Na verzenden", "status_title", "Titel", "Wat gebeurt hierna?"), field("Na verzenden", "status_text", "Tekst", "Na stap 3 slaan we je intake veilig op. In stap 4 kies je een datum zodra Calendly is gekoppeld; zonder koppeling neemt Kratos persoonlijk contact op.", "textarea", 420),
];

const contactFields: CmsFieldDefinition[] = [
  field("Introductie", "hero_eyebrow", "Bovenregel", "Contact"), field("Introductie", "hero_title", "Titel", "Laten we je"), field("Introductie", "hero_accent", "Groen deel", "volgende stap"), field("Introductie", "hero_suffix", "Titel na groen deel", "bespreken."), field("Introductie", "hero_intro", "Introductie", "Voor een inhoudelijke start gebruik je de intake. Voor een korte vraag kun je contact opnemen via de bestaande openbare contactgegevens.", "textarea", 420), field("Contactgegevens", "status_title", "Infokader — titel", "Niet bevestigd"), field("Contactgegevens", "status_text", "Infokader — tekst", "Vestigingsadres, openingstijden, servicegebied en responstijd zijn nog niet gepubliceerd omdat ze niet zijn geverifieerd.", "textarea", 420),
];

const siteSettingsFields: CmsFieldDefinition[] = [
  field("Navigatie", "nav_results", "Resultaten", "Resultaten"), field("Navigatie", "nav_method", "Werkwijze", "Werkwijze"), field("Navigatie", "nav_trajectories", "Trajecten", "Trajecten"), field("Navigatie", "nav_about", "Over Omar", "Over Omar"), field("Navigatie", "nav_tools", "Gratis tools", "Gratis tools"), field("Navigatie", "nav_cta", "Intakeknop", "Plan een intake"),
  field("Voettekst", "footer_tagline", "Korte omschrijving", "Persoonlijke coaching met aandacht voor jouw doel, ritme en volgende stap.", "textarea", 260), field("Voettekst", "footer_explore", "Kolomtitel ontdekken", "Ontdek"), field("Voettekst", "footer_policy", "Kolomtitel contact", "Contact & beleid"), field("Voettekst", "footer_signature", "Slotregel", "Unleash your power"), field("Merk", "brand_tagline", "Merkregel", "Unleash your power"),
];

export const cmsPageDefinitions: CmsPageDefinition[] = [
  { slug: "site-settings", route: "/", title: "Header & footer", description: "Navigatielabels, merktekst en voettekst. Routes en contactgegevens blijven beschermd.", fields: siteSettingsFields },
  { slug: "resultaten", route: "/resultaten", title: "Resultaten", description: "Hero, voortgang, context en cliëntverhalen.", fields: resultsFields },
  { slug: "werkwijze", route: "/werkwijze", title: "Werkwijze", description: "Aanpak, stappen, basis en laatste oproep.", fields: methodFields },
  { slug: "trajecten", route: "/trajecten", title: "Trajecten", description: "Catalogus, productpresentatie en detailteksten. Prijzen en betaalinstellingen blijven beschermd.", fields: catalogueFields },
  { slug: "over-omar", route: "/over-omar", title: "Over Omar", description: "Verhaal, waarden, coaching en werkwijze.", fields: aboutFields },
  { slug: "gratis-tools", route: "/gratis-tools", title: "Gratis tools", description: "Tooluitleg en medische beperkingen.", fields: toolsFields },
  { slug: "intake", route: "/intake", title: "Intake", description: "Uitleg rond het intakeformulier. Formuliervalidatie blijft beschermd.", fields: intakeFields },
  { slug: "contact", route: "/contact", title: "Contact", description: "Contactintroductie en gecontroleerd informatiekader.", fields: contactFields },
];

export function getCmsPageDefinition(slug: string | null | undefined) {
  return cmsPageDefinitions.find((definition) => definition.slug === slug) ?? null;
}

export function cmsPageDefaults(definition: CmsPageDefinition) {
  return Object.fromEntries(definition.fields.map((item) => [item.key, item.defaultValue])) as Record<string, string>;
}

function isSafeImageUrl(value: string) {
  if (value.startsWith("/")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname.endsWith(".supabase.co"); } catch { return false; }
}

export function parseCmsPageContent(definition: CmsPageDefinition, source: unknown) {
  const shape: Record<string, z.ZodType<string>> = {};
  definition.fields.forEach((item) => {
    const minimum = item.key.endsWith("_alt") ? 0 : item.kind === "image" ? 1 : 2;
    let schema = z.string().trim().min(minimum).max(item.maxLength ?? (item.kind === "textarea" ? 520 : 140));
    if (item.kind === "image") schema = schema.refine(isSafeImageUrl, "Kies een beeld uit de mediabibliotheek of gebruik een intern pad.");
    shape[item.key] = schema;
  });
  return z.object(shape).safeParse(source);
}
