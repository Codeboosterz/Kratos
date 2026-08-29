import "server-only";

import { createHash } from "node:crypto";

export function isStripeFulfillmentEvent(type: string) {
  return type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded";
}

export function hashWebhookPayload(payload: string) {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
