"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/src/supabase/database.types";
import { getSupabaseConfig } from "@/src/supabase/config";

export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
