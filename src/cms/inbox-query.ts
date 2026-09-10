import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/supabase/database.types";
import type { IntakeLeadStatus } from "@/src/schemas/intake-lead";

export const inboxPageSize = 50;
export function inboxPageNumber(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}
export function inboxSearchTerm(value?: string) {
  // Only literal name/email/reference characters; exclude PostgREST operators,
  // delimiters and LIKE wildcards rather than interpolating raw user input.
  return (value ?? "").trim().slice(0, 120).replace(/[^\p{L}\p{N}@ .-]/gu, "");
}
export function inboxDate(value: string) {
  return new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value));
}
export function inboxPageHref(view: "intakes" | "email", page: number, lead?: string, query?: string) {
  const params = new URLSearchParams({ view, page: String(page) });
  if (view === "intakes") { if (lead) params.set("lead", lead); if (query) params.set("query", query); }
  return `/beheer/inbox?${params}`;
}
export function queryInboxIntakes(supabase: SupabaseClient<Database>, page: number, lead: IntakeLeadStatus | "", query?: string) {
  let selection = supabase.from("intake_requests").select("*", { count: "exact" });
  if (lead) selection = selection.eq("lead_status", lead);
  const term = inboxSearchTerm(query);
  if (term) selection = selection.or(["customer_name", "customer_email", "reference", "product_slug"].map(column => `${column}.ilike.%${term}%`).join(","));
  return selection.order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * inboxPageSize, page * inboxPageSize - 1);
}
