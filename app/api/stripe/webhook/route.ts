import Stripe from "stripe";
import { createClaimToken, hashClaimToken } from "@/src/operations/fulfillment";
import { sendDigitalDeliveryEmail } from "@/src/operations/resend";
import { hashWebhookPayload, isStripeFulfillmentEvent } from "@/src/operations/stripe-fulfillment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { assertPersisted, claimWebhookEvent, finishWebhookEvent } from "@/src/operations/webhook-events";
import { createAdminClient } from "@/src/supabase/admin";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session, admin: ReturnType<typeof createAdminClient>) {
  if (session.status !== "complete" || (session.payment_status !== "paid" && session.payment_status !== "no_payment_required")) return { status: "ignored" as const, reason: "payment_not_confirmed" };
  const productId = session.metadata?.productId;
  const customerEmail = session.customer_details?.email ?? session.customer_email;
  if (!productId || !customerEmail) throw new Error("Checkout metadata of klantmail ontbreekt.");
  const { data: product, error: productError } = await admin.from("cms_products").select("id, name, status, digital_asset_id, trainerize_plan_id").eq("id", productId).maybeSingle();
  if (productError || !product || product.status !== "active") throw new Error("Actief CMS-product niet gevonden.");

  const now = new Date().toISOString();
  // Different Stripe event IDs can refer to the same checkout session.
  // Never reset an existing fulfilled/refunded order during event replay.
  assertPersisted(await admin.from("orders").upsert({
    stripe_checkout_session_id: session.id, stripe_payment_intent_id: paymentIntentId(session), product_id: product.id,
    customer_email: customerEmail, status: "paid", amount_total: session.amount_total ?? 0, currency: session.currency ?? "eur", paid_at: now, updated_at: now,
  }, { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true }), "Bestelling kon niet worden geregistreerd.");
  const { data: order, error: orderError } = await admin.from("orders").select("id, status").eq("stripe_checkout_session_id", session.id).single();
  if (orderError || !order) throw new Error("Bestelling kon niet worden gelezen.");
  if (order.status === "fulfilled") return { status: "completed" as const, orderId: order.id };
  if (order.status === "refunded" || order.status === "cancelled") return { status: "ignored" as const, reason: "order_closed" };

  let entitlementCreated = false;
  let deliveryWarning: string | null = null;
  if (product.digital_asset_id) {
    const { data: existing, error: existingError } = await admin.from("entitlements").select("id, status").eq("order_id", order.id).maybeSingle();
    if (existingError) throw new Error("Downloadrecht kon niet worden gelezen.");
    if (existing) {
      // A crash may have happened after issuing a token. Its plaintext is not
      // stored. Preserve it and require an explicit owner resend if necessary.
      entitlementCreated = existing.status === "active";
      deliveryWarning = "Bestaand downloadrecht behouden. Controleer de leveringsmail in Inbox; gebruik zo nodig Nieuwe downloadlink bij Bestellingen.";
    } else {
      const { data: asset, error: assetError } = await admin.from("digital_assets").select("id, status").eq("id", product.digital_asset_id).maybeSingle();
      if (assetError) throw new Error("PDF-status kon niet worden gelezen.");
      if (asset?.status === "ready") {
        const claimToken = createClaimToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
        // Unique order_id also prevents concurrent events from replacing a token.
        assertPersisted(await admin.from("entitlements").insert({ order_id: order.id, asset_id: asset.id, status: "active", claim_token_hash: hashClaimToken(claimToken), expires_at: expiresAt }), "Downloadrecht kon niet worden aangemaakt.");
        entitlementCreated = true;

        const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kratosfitness.be"}/api/download/${claimToken}`;
        const subject = `Jouw Kratos-document: ${product.name}`;
        const { data: thread, error: threadError } = await admin.from("email_threads").insert({ customer_email: customerEmail, subject, status: "waiting" }).select("id").single();
        if (threadError || !thread) throw new Error("Leveringsgesprek kon niet worden opgeslagen.");
        const { data: message, error: messageError } = await admin.from("email_messages").insert({
          thread_id: thread.id, direction: "outbound", sender: process.env.RESEND_FROM_EMAIL ?? "Kratos Fitness <noreply@kratosfitness.be>", recipients: [customerEmail], subject, delivery_status: "queued",
        }).select("id").single();
        if (messageError || !message) throw new Error("Leveringsmail kon niet worden geregistreerd.");
        let sent: Awaited<ReturnType<typeof sendDigitalDeliveryEmail>> | null = null;
        try {
          const apiKey = await resolveIntegrationSecret("resend", "api_key");
          const from = process.env.RESEND_FROM_EMAIL?.trim();
          if (!apiKey || !from) throw new Error("Resend is niet geconfigureerd.");
          sent = await sendDigitalDeliveryEmail({ apiKey, from, to: customerEmail, productName: product.name, claimUrl, orderId: order.id });
        } catch {
          deliveryWarning = "Downloadrecht aangemaakt, maar leveringsmail niet bevestigd. Controleer Resend en gebruik zo nodig Nieuwe downloadlink.";
        }
        const saved = await admin.from("email_messages").update(sent
          ? { provider_message_id: sent.id, html_body: sent.html, text_body: sent.text, delivery_status: "sent" }
          : { delivery_status: "failed" }).eq("id", message.id).select("id").maybeSingle();
        if (saved.error || !saved.data) throw new Error("Leveringsstatus kon niet worden opgeslagen.");
      } else deliveryWarning = "Gekoppelde PDF is nog geen goedgekeurd ready-asset.";
    }
  }
  if (product.trainerize_plan_id) assertPersisted(await admin.from("trainerize_provisioning_jobs").upsert({ order_id: order.id, trainerize_plan_id: product.trainerize_plan_id, status: "queued", updated_at: now }, { onConflict: "order_id", ignoreDuplicates: true }), "Provisioning kon niet worden ingepland.");
  const savedOrder = await admin.from("orders").update({ status: entitlementCreated ? "fulfilled" : "paid", fulfilled_at: entitlementCreated ? now : null, updated_at: now })
    .eq("id", order.id).eq("status", order.status).select("id").maybeSingle();
  if (savedOrder.error || !savedOrder.data) throw new Error("Bestelstatus kon niet worden opgeslagen of is intussen gewijzigd.");
  return { status: "completed" as const, orderId: order.id, deliveryWarning };
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: { code: "INVALID_INPUT", message: "Stripe-Signature ontbreekt." } }, { status: 400 });
  const rawBody = await request.text();
  const [secretKey, webhookSecret] = await Promise.all([resolveIntegrationSecret("stripe", "secret_key").catch(() => null), resolveIntegrationSecret("stripe", "webhook_secret").catch(() => null)]);
  if (!secretKey || !webhookSecret) return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Stripe-webhook is niet geconfigureerd." } }, { status: 503 });
  let event: Stripe.Event;
  try { event = new Stripe(secretKey).webhooks.constructEvent(rawBody, signature, webhookSecret); }
  catch { return Response.json({ error: { code: "INVALID_SIGNATURE", message: "Ongeldige webhookhandtekening." } }, { status: 400 }); }

  let admin;
  try { admin = createAdminClient(); } catch { return Response.json({ error: { code: "CONFIGURATION_REQUIRED", message: "Duurzame webhookopslag is niet geconfigureerd." } }, { status: 503 }); }
  const key = { provider: "stripe" as const, provider_event_id: event.id };
  let claim;
  try { claim = await claimWebhookEvent(admin, { ...key, event_type: event.type, payload_hash: hashWebhookPayload(rawBody) }); }
  catch { return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet duurzaam worden geregistreerd." } }, { status: 503 }); }
  if (claim.state === "duplicate") return Response.json({ received: true, duplicate: true });
  if (claim.state === "busy") return Response.json({ error: { code: "PROCESSING", message: "Webhook wordt nog verwerkt. Probeer opnieuw." } }, { status: 503 });

  try {
    if (!isStripeFulfillmentEvent(event.type)) {
      await finishWebhookEvent(admin, key, claim.attempt, "ignored");
      return Response.json({ received: true, ignored: true });
    }
    const result = await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, admin);
    await finishWebhookEvent(admin, key, claim.attempt, result.status, "deliveryWarning" in result ? result.deliveryWarning : null);
    return Response.json({ received: true, ...result });
  } catch {
    await finishWebhookEvent(admin, key, claim.attempt, "failed").catch(() => undefined);
    return Response.json({ error: { code: "FULFILLMENT_FAILED", message: "Fulfillment is veilig gestopt en kan opnieuw worden geprobeerd." } }, { status: 500 });
  }
}
