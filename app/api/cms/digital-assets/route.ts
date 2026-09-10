import { createHash, randomUUID } from "node:crypto";
import { getCmsMembership } from "@/src/cms/auth";
import { maximumPdfBytes, safeAssetFilename, validatePdfBytes } from "@/src/operations/digital-assets";
import { checkDurableRateLimit } from "@/src/server/rate-limit";

export async function POST(request: Request) {
  const authenticated = await getCmsMembership();
  if (!authenticated) return Response.json({ error: { code: "UNAUTHENTICATED", message: "Log opnieuw in." } }, { status: 401 });
  if (authenticated.membership.role === "editor") return Response.json({ error: { code: "FORBIDDEN", message: "Eigenaarstoegang vereist." } }, { status: 403 });
  const rateLimit = await checkDurableRateLimit({ namespace: "cms-pdf-upload", key: authenticated.userId, limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) return Response.json({ error: { code: "RATE_LIMITED", message: "Wacht even voor een nieuwe upload." } }, { status: 429 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return Response.json({ error: { code: "INVALID_INPUT", message: "Ongeldig uploadformulier." } }, { status: 400 }); }
  const file = formData.get("file");
  const productId = formData.get("productId");
  if (!(file instanceof File) || typeof productId !== "string" || !/^[a-zA-Z0-9_-]{2,120}$/.test(productId)) {
    return Response.json({ error: { code: "INVALID_INPUT", message: "PDF en product zijn vereist." } }, { status: 400 });
  }
  if (file.size > maximumPdfBytes) return Response.json({ error: { code: "INVALID_PDF", message: "Gebruik een PDF van maximaal 20 MB." } }, { status: 400 });
  const { supabase, userId } = authenticated;
  const product = await supabase.from("cms_products").select("id").eq("id", productId).maybeSingle();
  if (product.error) return Response.json({ error: { code: "DATABASE_FAILURE", message: "Product kon niet worden gecontroleerd." } }, { status: 503 });
  if (!product.data) return Response.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Sla het product eerst op en probeer opnieuw." } }, { status: 404 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validatePdfBytes(bytes, file.type);
  if (!validation.ok) return Response.json({ error: { code: "INVALID_PDF", message: "Gebruik een geldige PDF van maximaal 20 MB." } }, { status: 400 });

  const filename = safeAssetFilename(file.name);
  const storagePath = `${productId}/${randomUUID()}-${filename}`;
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const { error: uploadError } = await supabase.storage.from("digital-products").upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) return Response.json({ error: { code: "STORAGE_FAILURE", message: "De privé-upload is mislukt." } }, { status: 502 });

  const { data: asset, error: assetError } = await supabase.from("digital_assets").insert({
    storage_path: storagePath, filename, mime_type: "application/pdf", size_bytes: bytes.byteLength,
    source: "upload", status: "ready", checksum_sha256: checksum, created_by: userId,
  }).select("id").single();
  if (assetError || !asset) {
    await supabase.storage.from("digital-products").remove([storagePath]);
    return Response.json({ error: { code: "DATABASE_FAILURE", message: "De PDF kon niet worden geregistreerd." } }, { status: 502 });
  }
  const linked = await supabase.from("cms_products").update({ digital_asset_id: asset.id, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", productId).select("id").maybeSingle();
  if (linked.error || !linked.data) return Response.json({ error: { code: "PRODUCT_LINK_FAILED", message: "PDF opgeslagen, maar nog niet gekoppeld aan het product." } }, { status: 502 });
  return Response.json({ message: "PDF privé opgeslagen en aan het product gekoppeld.", assetId: asset.id });
}
