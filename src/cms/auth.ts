import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/src/supabase/config";
import { createClient } from "@/src/supabase/server";

export type CmsMembership = {
  user_id: string;
  role: "super_admin" | "owner" | "editor";
  display_name: string | null;
  active: boolean;
};

export async function getCmsMembership() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return null;
  const { data: membership } = await supabase.from("cms_memberships").select("user_id, role, display_name, active").eq("user_id", userId).maybeSingle();
  if (!membership?.active) return null;
  return { supabase, userId, membership: membership as CmsMembership };
}

export async function requireCmsMembership() {
  if (!isSupabaseConfigured()) redirect("/beheer/login?status=configuratie-nodig");

  const authenticated = await getCmsMembership();
  if (!authenticated) redirect("/beheer/login");
  return authenticated;
}
