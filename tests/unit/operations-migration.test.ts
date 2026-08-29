import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../supabase/migrations/20260828104426_cms_operations_hub.sql", import.meta.url), "utf8");

describe("CMS operations migration", () => {
  it("creates the operational records required by the approved build order", () => {
    for (const table of ["integration_connections", "integration_secret_refs", "cms_products", "digital_assets", "orders", "entitlements", "provider_webhook_events", "email_threads", "email_messages", "trainerize_provisioning_jobs", "ai_jobs", "ai_usage_events"]) {
      expect(sql).toContain(`create table public.${table}`);
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("keeps paid PDFs private and constrains uploads at the bucket", () => {
    expect(sql).toContain("'digital-products', 'digital-products', false");
    expect(sql).toContain("array['application/pdf']");
    expect(sql).not.toContain("getPublicUrl");
  });

  it("stores credentials in Vault and exposes secret reads only to service_role", () => {
    expect(sql).toContain("create extension if not exists supabase_vault");
    expect(sql).toContain("vault.create_secret");
    expect(sql).toContain("grant execute on function public.get_integration_secret_for_server(text, text) to service_role;");
    expect(sql).toContain("revoke all on function public.get_integration_secret_for_server(text, text) from public, anon, authenticated;");
  });

  it("never grants anonymous access to operational or paid-content records", () => {
    expect(sql).not.toMatch(/grant\s+(?:select|insert|update|delete)[^;]*(?:orders|entitlements|digital_assets|integration_secret_refs)[^;]*\s+to\s+anon/i);
  });

  it("provides a service-role-only distributed rate limiter", () => {
    expect(sql).toContain("create table private.api_rate_limit_buckets");
    expect(sql).toContain("create or replace function public.consume_api_rate_limit");
    expect(sql).toContain("grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;");
  });
});
