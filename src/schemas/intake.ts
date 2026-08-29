import { z } from "zod";
import { goalKeys } from "@/src/domain/products";

export const experienceLevels = ["beginner", "gemiddeld", "ervaren"] as const;
export const trainingFormats = ["personal_training", "online", "duo", "home_workout", "nog_onbekend"] as const;
export const contactChannels = ["email", "telefoon"] as const;
export const intakeSources = ["home-hero", "home-method", "home-final", "header", "mobile-menu", "sticky", "trajecten-hero", "trajecten-help", "product-detail", "product-fit", "product-start", "results", "about", "tools", "contact", "checkout-success"] as const;

export const intakeSchema = z.object({
  goal: z.enum(goalKeys, { message: "Kies je belangrijkste doel." }),
  experience: z.enum(experienceLevels, { message: "Kies je ervaringsniveau." }),
  format: z.enum(trainingFormats, { message: "Kies een voorkeursvorm." }),
  availability: z.string().trim().min(2, "Beschrijf kort wanneer je meestal kunt trainen.").max(120),
  note: z.string().trim().max(600, "Houd je toelichting onder 600 tekens.").optional().default(""),
  name: z.string().trim().min(2, "Vul je naam in.").max(100),
  email: z.email("Vul een geldig e-mailadres in."),
  phone: z.string().trim().max(30).optional().default(""),
  contactChannel: z.enum(contactChannels),
  consent: z.literal(true, { message: "Bevestig dat we contact over deze intake mogen opnemen." }),
  consentVersion: z.literal("2026-08-draft-1"),
  product: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
  source: z.enum(intakeSources).nullable(),
  idempotencyKey: z.uuid(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

export const intakeStepOneSchema = intakeSchema.pick({ goal: true, experience: true });
export const intakeStepTwoSchema = intakeSchema.pick({ format: true, availability: true, note: true });
export const intakeStepThreeSchema = intakeSchema.pick({ name: true, email: true, phone: true, contactChannel: true, consent: true });

export const intakeDraftStorageSchema = z.object({
  step: z.number().int().min(1).max(3),
  draft: z.object({
    goal: z.union([z.enum(goalKeys), z.literal("")]),
    experience: z.union([z.enum(experienceLevels), z.literal("")]),
    format: z.union([z.enum(trainingFormats), z.literal("")]),
    availability: z.string().max(120),
    name: z.string().max(100),
    email: z.string().max(320),
    phone: z.string().max(30),
    contactChannel: z.enum(contactChannels),
    consentVersion: z.literal("2026-08-draft-1"),
    product: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
    source: z.enum(intakeSources).nullable(),
    idempotencyKey: z.uuid(),
  }),
});
