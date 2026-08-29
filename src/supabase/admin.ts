import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/supabase/database.types";
import { getSupabaseConfig } from "@/src/supabase/config";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is niet geconfigureerd.");
  const { url } = getSupabaseConfig();
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
