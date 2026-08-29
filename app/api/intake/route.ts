import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { buildCalendlyEmbedUrl } from "@/src/operations/calendly";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { intakeSchema } from "@/src/schemas/intake";
import { fixtureMode } from "@/src/server/environment";
import { createFixtureIntake } from "@/src/server/fixture-store";
import { checkRateLimit, requestClientKey } from "@/src/server/rate-limit";
import { createAdminClient } from "@/src/supabase/admin";

function intakeReference(idempotencyKey: string) {
  const year = String(new Date().getUTCFullYear()).slice(-2);
  const suffix = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 8).toUpperCase();
  return `KRA-${year}-${suffix}`;
}

export async function POST(request: Request) {
  const limit = checkRateLimit({ namespace: "intake", key: requestClientKey(request), limit: 8, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: { code: "RATE_LIMITED", message: "Te veel verzoeken. Probeer het over een minuut opnieuw.", retryable: true } }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  let json: unknown;
  try { json = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "De aanvraag bevat geen geldige gegevens.", retryable: false } }, { status: 400 });
  }
  const parsed = intakeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "Controleer de gemarkeerde velden.", retryable: true, fieldErrors: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const headerKey = request.headers.get("idempotency-key");
  if (headerKey !== parsed.data.idempotencyKey) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_INPUT", message: "De aanvraag kon niet veilig worden verwerkt.", retryable: true } }, { status: 400 });
  }

  if (fixtureMode) {
    const record = createFixtureIntake(parsed.data.idempotencyKey);
    console.info(JSON.stringify({ event: "intake_fixture_created", reference: record.reference, source: parsed.data.source, product: parsed.data.product }));
    return NextResponse.json({ ok: true, reference: record.reference, demo: true, schedulingUrl: null }, { status: 201 });
  }

  let admin;
  try { admin = createAdminClient(); }
  catch {
    return NextResponse.json({ ok: false, error: { code: "CONFIGURATION_REQUIRED", message: "De intakebestemming is nog niet gekoppeld. Je antwoorden blijven in dit formulier staan.", retryable: true } }, { status: 503 });
  }

  const reference = intakeReference(parsed.data.idempotencyKey);
  const { error: insertError } = await admin.from("intake_requests").upsert({
    reference,
    idempotency_key: parsed.data.idempotencyKey,
    goal: parsed.data.goal,
    experience: parsed.data.experience,
    training_format: parsed.data.format,
    availability: parsed.data.availability,
    note: parsed.data.note,
    customer_name: parsed.data.name,
    customer_email: parsed.data.email.toLowerCase(),
    customer_phone: parsed.data.phone,
    contact_channel: parsed.data.contactChannel,
    consent_version: parsed.data.consentVersion,
    product_slug: parsed.data.product,
    source: parsed.data.source,
    updated_at: new Date().toISOString(),
  }, { onConflict: "idempotency_key" });
  if (insertError) {
    return NextResponse.json({ ok: false, error: { code: "DATABASE_FAILURE", message: "De intake kon niet veilig worden opgeslagen. Probeer opnieuw.", retryable: true } }, { status: 503 });
  }

  const schedulingUrl = await resolveIntegrationSecret("calendly", "scheduling_url").catch(() => null);
  let bookingUrl: string | null = null;
  if (schedulingUrl) {
    try { bookingUrl = buildCalendlyEmbedUrl(schedulingUrl, { name: parsed.data.name, email: parsed.data.email, reference }); }
    catch { bookingUrl = null; }
  }
  console.info(JSON.stringify({ event: "intake_created", reference, source: parsed.data.source, product: parsed.data.product, schedulingAvailable: Boolean(bookingUrl) }));
  return NextResponse.json({ ok: true, reference, schedulingUrl: bookingUrl }, { status: 201 });
}
