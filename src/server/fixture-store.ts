import "server-only";
import { createHash } from "node:crypto";

type FixtureIntake = { reference: string; createdAt: string };
const fixtureIntakes = new Map<string, FixtureIntake>();

export function createFixtureIntake(idempotencyKey: string): FixtureIntake {
  const existing = fixtureIntakes.get(idempotencyKey);
  if (existing) return existing;
  const reference = `DEMO-INT-${createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 8).toUpperCase()}`;
  const record = { reference, createdAt: new Date().toISOString() };
  fixtureIntakes.set(idempotencyKey, record);
  return record;
}

export type FixtureOrderStatus = "processing" | "paid" | "unpaid" | "expired";
export type FixtureOrder = { sessionId: string; productSlug: string; status: FixtureOrderStatus; demo: true };
const fixtureOrders = new Map<string, FixtureOrder>();

export function createFixtureOrder(productSlug: string, idempotencyKey: string): FixtureOrder {
  const sessionId = `demo_cs_${createHash("sha256").update(`${productSlug}:${idempotencyKey}`).digest("hex").slice(0, 18)}`;
  const existing = fixtureOrders.get(sessionId);
  if (existing) return existing;
  // Fixture orders are authoritative test records. They never exist in production.
  const record: FixtureOrder = { sessionId, productSlug, status: "paid", demo: true };
  fixtureOrders.set(sessionId, record);
  return record;
}

export function getFixtureOrder(sessionId: string) { return fixtureOrders.get(sessionId) ?? null; }
export function setFixtureOrderStatus(sessionId: string, status: FixtureOrderStatus) {
  const order = fixtureOrders.get(sessionId);
  if (!order) return null;
  order.status = status;
  return order;
}
