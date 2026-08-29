import { redirect } from "next/navigation";
import { z } from "zod";
import { hashClaimToken } from "@/src/operations/fulfillment";
import { checkDurableRateLimit, requestClientKey } from "@/src/server/rate-limit";
import { createAdminClient } from "@/src/supabase/admin";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rateLimit = await checkDurableRateLimit({ namespace: "digital-download", key: requestClientKey(request), limit: 20, windowMs: 60_000 });
  if (!rateLimit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Te veel downloadpogingen." } }, { status: 429 });
  const { token } = await params;
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return Response.json({ error: { code: "NOT_FOUND", message: "Downloadlink niet gevonden." } }, { status: 404 });
  let admin;
  try { admin = createAdminClient(); } catch { return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Downloadservice niet beschikbaar." } }, { status: 503 }); }
  const { data: entitlement } = await admin.from("entitlements").select("id, asset_id, status, expires_at, download_count").eq("claim_token_hash", hashClaimToken(parsed.data)).maybeSingle();
  if (!entitlement || entitlement.status !== "active" || (entitlement.expires_at && new Date(entitlement.expires_at).getTime() <= Date.now())) return Response.json({ error: { code: "NOT_FOUND", message: "Downloadlink is ongeldig of verlopen." } }, { status: 404 });
  const { data: asset } = await admin.from("digital_assets").select("storage_path, status").eq("id", entitlement.asset_id).maybeSingle();
  if (!asset || asset.status !== "ready") return Response.json({ error: { code: "NOT_AVAILABLE", message: "Document is tijdelijk niet beschikbaar." } }, { status: 409 });
  const { data: signed, error } = await admin.storage.from("digital-products").createSignedUrl(asset.storage_path, 60, { download: true });
  if (error || !signed?.signedUrl) return Response.json({ error: { code: "STORAGE_FAILURE", message: "Download kon niet worden voorbereid." } }, { status: 502 });
  await admin.from("entitlements").update({ download_count: entitlement.download_count + 1, last_downloaded_at: new Date().toISOString() }).eq("id", entitlement.id);
  redirect(signed.signedUrl);
}
