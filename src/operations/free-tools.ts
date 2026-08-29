import { z } from "zod";

const bmiInputSchema = z.object({ heightCm: z.number().min(91.44).max(274.32), weightKg: z.number().min(24.947).max(453.592) });
const calorieInputSchema = bmiInputSchema.extend({ age: z.number().int().min(20).max(100), formulaSex: z.enum(["male", "female"]), activity: z.enum(["sedentary", "light", "moderate", "active"]) });

export type BmiInput = z.infer<typeof bmiInputSchema>;
export type CalorieInput = z.infer<typeof calorieInputSchema>;

export function calculateAdultBmi(input: BmiInput) {
  const value = bmiInputSchema.parse(input);
  const bmi = value.weightKg / Math.pow(value.heightCm / 100, 2);
  const rounded = Math.round(bmi * 10) / 10;
  return { value: rounded, category: rounded < 18.5 ? "Ondergewicht" : rounded < 25 ? "Gezond gewicht" : rounded < 30 ? "Overgewicht" : "Obesitascategorie" };
}

const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 } as const;

export function estimateDailyCalories(input: CalorieInput) {
  const value = calorieInputSchema.parse(input);
  const constant = value.formulaSex === "male" ? 5 : -161;
  const restingKcal = Math.round(10 * value.weightKg + 6.25 * value.heightCm - 5 * value.age + constant);
  return { restingKcal, maintenanceKcal: Math.round((restingKcal * activityFactors[value.activity]) / 10) * 10 };
}
