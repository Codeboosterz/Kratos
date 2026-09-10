import { describe, expect, it } from "vitest";
import { inboxPageNumber, inboxPageSize, inboxPageHref, inboxSearchTerm, inboxDate, queryInboxIntakes } from "@/src/cms/inbox-query";

describe("Inbox history query", () => {
  it.each([[undefined, 1], ["0", 1], ["-2", 1], ["NaN", 1], ["2.5", 1], ["5", 5]])("normalizes page %s", (value, expected) => {
    expect(inboxPageNumber(value as string | undefined)).toBe(expected); expect(inboxPageSize).toBe(50);
  });
  it("keeps search outside PostgREST filter grammar", () => {
    expect(inboxSearchTerm('Ada,reference.neq.null)("')).toBe("Adareference.neq.null");
    expect(inboxSearchTerm("  QA@example.com  ")).toBe("QA@example.com");
    expect(inboxSearchTerm("x".repeat(200))).toHaveLength(120);
  });
  it("preserves only the relevant filters in pagination links", () => {
    const href = new URL(inboxPageHref("intakes", 2, "new", "QA & friends"), "https://example.test");
    expect(Object.fromEntries(href.searchParams)).toEqual({ view: "intakes", page: "2", lead: "new", query: "QA & friends" });
    expect(inboxPageHref("email", 3, "new", "ignore")).toBe("/beheer/inbox?view=email&page=3");
  });
  it("formats the timestamp in Brussels regardless of server timezone", () => {
    expect(inboxDate("2026-09-12T08:00:00Z")).toContain("10:00");
  });
  it("filters the database before selecting a page", () => {
    const calls: unknown[][] = [];
    const chain = { select: (...args: unknown[]) => { calls.push(["select", ...args]); return chain; },
      eq: (...args: unknown[]) => { calls.push(["eq", ...args]); return chain; },
      or: (...args: unknown[]) => { calls.push(["or", ...args]); return chain; },
      order: (...args: unknown[]) => { calls.push(["order", ...args]); return chain; },
      range: (...args: unknown[]) => { calls.push(["range", ...args]); return chain; } };
    const db = { from: () => chain } as unknown as Parameters<typeof queryInboxIntakes>[0];
    queryInboxIntakes(db, 3, "new", "QA");
    expect(calls).toContainEqual(["eq", "lead_status", "new"]);
    expect(calls.find(call => call[0] === "or")?.[1]).toContain("customer_email.ilike.%QA%");
    expect(calls.at(-1)).toEqual(["range", 100, 149]);
  });
});
