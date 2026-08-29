import "server-only";
import { z } from "zod";
import trainerizeConfig from "@/config/trainerize-plans.json";

const exactBase = "https://www.trainerize.me/profile/kratoscoaching1/";

const planSchema = z.object({
  id: z.string(),
  planGUID: z.string().regex(/^[a-f0-9]{32}$/),
  url: z.string().url(),
  productSlug: z.string().nullable(),
  displayName: z.string().nullable(),
  price: z.unknown().nullable(),
  status: z.enum(["mapping_required", "verified", "disabled"]),
});

export const trainerizePlans = z.object({ plans: z.array(planSchema).length(10) }).parse(trainerizeConfig).plans;

const guids = new Set(trainerizePlans.map((plan) => plan.planGUID));
const urls = new Set(trainerizePlans.map((plan) => plan.url));
if (guids.size !== 10 || urls.size !== 10) throw new Error("Trainerize plans must remain ten unique entries.");

for (const plan of trainerizePlans) {
  const url = new URL(plan.url);
  if (`${url.origin}${url.pathname}` !== exactBase || url.searchParams.get("planGUID") !== plan.planGUID) {
    throw new Error(`Rejected Trainerize configuration: ${plan.id}`);
  }
}

export function getVerifiedTrainerizeUrl(planId: string): string | null {
  const plan = trainerizePlans.find((item) => item.id === planId);
  return plan?.status === "verified" && plan.productSlug ? plan.url : null;
}
