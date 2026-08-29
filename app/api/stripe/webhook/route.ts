import Stripe from "stripe";
import { createClaimToken, hashClaimToken } from "@/src/operations/fulfillment";
import { sendDigitalDeliveryEmail } from "@/src/operations/resend";
import { hashWebhookPayload, isStripeFulfillmentEvent } from "@/src/operations/stripe-fulfillment";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { createAdminClient } from "@/src/supabase/admin";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return { status: "ignored" as const, reason: "payment_not_confirmed" };
  const productId = session.metadata?.productId;
  const customerEmail = session.customer_details?.email ?? session.customer_email;
  if (!productId || !customerEmail) throw new Error("Checkout metadata of klantmail ontbreekt.");
  const admin = createAdminClient();
  const { data: product, error: productError } = await admin.from("cms_products").select("id, name, status, digital_asset_id, trainerize_plan_id").eq("id", productId).maybeSingle();
  if (productError || !product || product.status !== "active") throw new Error("Actief CMS-product niet gevonden.");

  const now = new Date().toISOString();
  const { data: order, error: orderError } = await admin.from("orders").upsert({
    stripe_checkout_session_id: session.id, stripe_payment_intent_id: paymentIntentId(session), product_id: product.id,
    customer_email: customerEmail, status: "paid", amount_total: session.amount_total ?? 0, currency: session.currency ?? "eur", paid_at: now, updated_at: now,
  }, { onConflict: "stripe_checkout_session_id" }).select("id").single();
  if (orderError || !order) throw new Error(`Bestelling kon niet worden geregistreerd: ${orderError?.message ?? "geen record"}`);

  let entitlementCreated = false;
  let deliveryWarning: string | null = null;
  if (product.digital_asset_id) {
    const { data: asset } = await admin.from("digital_assets").select("id, status").eq("id", product.digital_asset_id).maybeSingle();
    if (asset?.status === "ready") {
      const claimToken = createClaimToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
      const { error: entitlementError } = await admin.from("entitlements").upsert({ order_id: order.id, asset_id: asset.id, status: "active", claim_token_hash: hashClaimToken(claimToken), expires_at: expiresAt }, { onConflict: "order_id" });
      if (entitlementError) throw new Error(`Downloadrecht kon niet worden aangemaakt: ${entitlementError.message}`);
      entitlementCreated = true;

      const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://kratosfitness.be"}/api/download/${claimToken}`;
      const subject = `Jouw Kratos-document: ${product.name}`;
      const { data: thread } = await admin.from("email_threads").insert({ customer_email: customerEmail, subject, status: "waiting" }).select("id").single();
      const { data: message } = thread ? await admin.from("email_messages").insert({
        thread_id: thread.id, direction: "outbound", sender: process.env.RESEND_FROM_EMAIL ?? "Kratos Fitness <noreply@kratosfitness.be>", recipients: [customerEmail], subject, delivery_status: "queued",
      }).select("id").single() : { data: null };
      try {
        const [apiKey, from] = await Promise.all([resolveIntegrationSecret("resend", "api_key"), Promise.resolve(process.env.RESEND_FROM_EMAIL?.trim())]);
        if (!apiKey || !from) throw new Error("Resend API key of afzender ontbreekt.");
        const sent = await sendDigitalDeliveryEmail({ apiKey, from, to: customerEmail, productName: product.name, claimUrl, orderId: order.id });
        if (message) await admin.from("email_messages").update({ provider_message_id: sent.id, html_body: sent.html, text_body: sent.text, delivery_status: "sent" }).eq("id", message.id);
      } catch (error) {
        deliveryWarning = error instanceof Error ? error.message : "Leveringsmail mislukt.";
        if (message) await admin.from("email_messages").update({ delivery_status: "failed" }).eq("id", message.id);
      }
    } else deliveryWarning = "Gekoppelde PDF is nog geen goedgekeurd ready-asset.";
  }
  if (product.trainerize_plan_id) await admin.from("trainerize_provisioning_jobs").upsert({ order_id: order.id, trainerize_plan_id: product.trainerize_plan_id, status: "queued", updated_at: now }, { onConflict: "order_id" });
  await admin.from("orders").update({ status: entitlementCreated ? "fulfilled" : "paid", fulfilled_at: entitlementCreated ? now : null, updated_at: now }).eq("id", order.id);
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
  const { error: insertError } = await admin.from("provider_webhook_events").insert({ provider: "stripe", provider_event_id: event.id, event_type: event.type, status: "processing", attempts: 1, payload_hash: hashWebhookPayload(rawBody) });
  if (insertError?.code === "23505") {
    const { data: existing } = await admin.from("provider_webhook_events").select("status, attempts").eq("provider", "stripe").eq("provider_event_id", event.id).maybeSingle();
    if (existing?.status === "completed" || existing?.status === "ignored" || existing?.status === "processing") return Response.json({ received: true, duplicate: true });
    await admin.from("provider_webhook_events").update({ status: "processing", attempts: (existing?.attempts ?? 0) + 1, last_error: null }).eq("provider", "stripe").eq("provider_event_id", event.id);
  } else if (insertError) return Response.json({ error: { code: "DATABASE_FAILURE", message: "Webhook kon niet duurzaam worden geregistreerd." } }, { status: 503 });

  try {
    if (!isStripeFulfillmentEvent(event.type)) {
      await admin.from("provider_webhook_events").update({ status: "ignored", processed_at: new Date().toISOString() }).eq("provider", "stripe").eq("provider_event_id", event.id);
      return Response.json({ received: true, ignored: true });
    }
    const result = await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
    await admin.from("provider_webhook_events").update({ status: result.status === "ignored" ? "ignored" : "completed", processed_at: new Date().toISOString(), last_error: "deliveryWarning" in result ? result.deliveryWarning : null }).eq("provider", "stripe").eq("provider_event_id", event.id);
    return Response.json({ received: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1_000) : "Fulfillment mislukt.";
    await admin.from("provider_webhook_events").update({ status: "failed", last_error: message }).eq("provider", "stripe").eq("provider_event_id", event.id);
    return Response.json({ error: { code: "FULFILLMENT_FAILED", message: "Fulfillment is veilig gestopt en kan opnieuw worden geprobeerd." } }, { status: 500 });
  }
}
