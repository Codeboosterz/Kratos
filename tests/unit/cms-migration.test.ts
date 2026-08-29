import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../supabase/migrations/20260821170000_create_kratos_cms.sql", import.meta.url), "utf8");

describe("CMS migration security boundary", () => {
  it("enables RLS for every public CMS table", () => {
    for (const table of ["cms_memberships", "content_pages", "content_revisions", "media_assets", "cms_audit_events"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("uses explicit Data API grants and never grants anonymous writes", () => {
    expect(sql).toContain("grant select on table public.content_pages, public.content_revisions to anon;");
    expect(sql).not.toMatch(/grant\s+(?:insert|update|delete)[^;]*\s+to\s+anon/i);
  });

  it("keeps mutations behind authenticated, role-checked functions", () => {
    expect(sql).toContain("caller_id is null or not private.is_cms_editor()");
    expect(sql).toContain("caller_id is null or not private.is_cms_owner()");
    expect(sql).toContain("grant execute on function public.cms_save_content_revision(text, jsonb, text) to authenticated;");
    expect(sql).toContain("grant execute on function public.cms_publish_content_revision(uuid) to authenticated;");
  });

  it("gives super admins full CMS authority without anonymous access", () => {
    expect(sql).toContain("role in ('super_admin', 'owner', 'editor')");
    expect(sql).toContain("create or replace function private.is_cms_super_admin()");
    expect(sql).toContain("super admins can add cms members");
    expect(sql).toContain("grant insert, update, delete on table public.cms_memberships to authenticated;");
  });

  it("restricts media types, size and authenticated storage writes", () => {
    expect(sql).toContain("8388608");
    expect(sql).toContain("array['image/jpeg', 'image/png', 'image/webp', 'image/avif']");
    expect(sql).toContain("on storage.objects for insert to authenticated");
  });
});
