import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/src/supabase/database.types";
import { isSupabaseConfigured, getSupabaseConfig } from "@/src/supabase/config";

export async function updateSupabaseSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the access token and refreshes it when necessary.
  await supabase.auth.getClaims();
  return response;
}
