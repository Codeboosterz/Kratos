import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/supabase/database.types";
import { getSupabaseConfig } from "@/src/supabase/config";

export function createPublicClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
