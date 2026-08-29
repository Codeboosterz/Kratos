import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = resolve(process.cwd(), "supabase/migrations");
const migrationName = readdirSync(migrationDirectory).find((name) => name.endsWith("_intake_lead_workflow.sql"));
const migrationPath = migrationName ? resolve(migrationDirectory, migrationName) : "";
const migrationSql = migrationPath && existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
const calendlyApi = readFileSync(resolve(process.cwd(), "src/operations/calendly-api.ts"), "utf8");

describe("intake lead workflow boundary", () => {
  it("ships a dedicated, reproducible workflow migration", () => {
    expect(migrationName).toBeTruthy();
  });

  it("adds constrained workflow fields and query indexes", () => {
    expect(migrationSql).toContain("lead_status");
    expect(migrationSql).toContain("read_at");
    expect(migrationSql).toContain("read_by");
    expect(migrationSql).toContain("internal_note");
    expect(migrationSql).toContain("intake_requests_lead_status_created_idx");
    expect(migrationSql).toContain("intake_requests_unread_created_idx");
  });

  it("keeps anonymous users out and authorizes owner workflow updates", () => {
    expect(migrationSql).toContain("revoke all on table public.intake_requests from anon, authenticated");
    expect(migrationSql).toContain("grant select, update on table public.intake_requests to authenticated");
    expect(migrationSql).toContain("for update to authenticated");
    expect(migrationSql).toContain("private.is_cms_owner()");
    expect(migrationSql).toContain("with check");
    expect(migrationSql).not.toMatch(/grant\s+(?:select|insert|update|delete)[^;]*\s+to\s+anon/i);
  });

  it("reconciles canceled Calendly records instead of fetching active events only", () => {
    expect(calendlyApi).not.toContain('status: "active"');
  });
});
