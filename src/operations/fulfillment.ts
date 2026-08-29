import { createHash, randomBytes } from "node:crypto";

export function createClaimToken() {
  return randomBytes(32).toString("base64url");
}

export function hashClaimToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function normalizeFulfillmentState(session: { status: string | null; payment_status: string }) {
  if (session.status === "expired") return "cancelled" as const;
  if (session.status === "complete" && session.payment_status === "paid") return "ready" as const;
  return "waiting_for_payment" as const;
}
