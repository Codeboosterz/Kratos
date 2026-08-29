import { describe, expect, it } from "vitest";
import { hashWebhookPayload, isStripeFulfillmentEvent } from "@/src/operations/stripe-fulfillment";

describe("Stripe fulfillment guardrails", () => {
  it("fulfills only checkout completion events", () => {
    expect(isStripeFulfillmentEvent("checkout.session.completed")).toBe(true);
    expect(isStripeFulfillmentEvent("checkout.session.async_payment_succeeded")).toBe(true);
    expect(isStripeFulfillmentEvent("customer.created")).toBe(false);
  });

  it("creates a stable SHA-256 payload fingerprint", () => {
    expect(hashWebhookPayload("same")).toBe(hashWebhookPayload("same"));
    expect(hashWebhookPayload("same")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashWebhookPayload("same")).not.toBe(hashWebhookPayload("different"));
  });
});
