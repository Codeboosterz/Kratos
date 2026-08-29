import { z } from "zod";

export const checkoutSessionSchema = z.object({
  productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  idempotencyKey: z.uuid(),
});

export const checkoutSessionIdSchema = z.string().regex(/^(?:demo_cs_[a-f0-9]{18}|cs_(?:test|live)_[A-Za-z0-9_]+)$/);

export type CheckoutStatus = "processing" | "paid" | "unpaid" | "expired" | "failed" | "unknown";

export function normalizeStripeCheckoutStatus(input: { status: string | null; payment_status: string | null }): CheckoutStatus {
  if (input.payment_status === "paid" || input.payment_status === "no_payment_required") return "paid";
  if (input.status === "expired") return "expired";
  if (input.status === "complete") return "unpaid";
  if (input.status === "open") return "processing";
  return "unknown";
}
