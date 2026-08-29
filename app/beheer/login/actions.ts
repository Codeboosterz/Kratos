"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/src/supabase/config";
import { createClient } from "@/src/supabase/server";

export type LoginState = { message?: string; fieldErrors?: { email?: string[]; password?: string[] } };

const loginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in.").trim(),
  password: z.string().min(8, "Je wachtwoord bevat minimaal 8 tekens."),
});

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return { message: "De CMS-database is nog niet gekoppeld. Voeg eerst de Supabase-omgevingsvariabelen toe." };
  }

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { message: "Inloggen is niet gelukt. Controleer je gegevens." };

  const { data: membership } = await supabase
    .from("cms_memberships")
    .select("active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!membership?.active) {
    await supabase.auth.signOut();
    return { message: "Dit account heeft geen toegang tot Kratos Beheer." };
  }

  redirect("/beheer");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/beheer/login");
}
