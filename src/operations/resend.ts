import "server-only";

import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderDeliveryEmail(input: { productName: string; claimUrl: string }) {
  const productName = escapeHtml(input.productName);
  const claimUrl = escapeHtml(input.claimUrl);
  return {
    subject: `Jouw Kratos-document: ${input.productName}`,
    html: `<div style="font-family:Arial,sans-serif;background:#0b0d0a;color:#f4f6ef;padding:32px"><div style="max-width:620px;margin:auto;background:#151812;border:1px solid #354323;border-radius:18px;padding:32px"><p style="color:#a9cf68;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Kratos Fitness</p><h1 style="font-size:28px;margin:12px 0">Jouw document staat klaar</h1><p>Bedankt voor je bestelling van <strong>${productName}</strong>.</p><p><a href="${claimUrl}" style="display:inline-block;background:#a9cf68;color:#0b0d0a;padding:14px 20px;border-radius:9px;text-decoration:none;font-weight:800">Download veilig</a></p><p style="color:#a9aDA5;font-size:13px">Deze persoonlijke link kan verlopen of worden ingetrokken. Deel hem niet met anderen.</p></div></div>`,
    text: `Jouw Kratos-document staat klaar: ${input.productName}\n\nDownload veilig via ${input.claimUrl}\n\nDeze persoonlijke link kan verlopen of worden ingetrokken.`,
  };
}

export async function sendDigitalDeliveryEmail(input: { apiKey: string; from: string; to: string; productName: string; claimUrl: string; orderId: string }) {
  const resend = new Resend(input.apiKey);
  const email = renderDeliveryEmail(input);
  const { data, error } = await resend.emails.send({ from: input.from, to: input.to, subject: email.subject, html: email.html, text: email.text }, { idempotencyKey: `kratos-delivery-${input.orderId}` });
  if (error || !data?.id) throw new Error(error?.message ?? "Resend accepteerde de e-mail niet.");
  return { id: data.id, ...email };
}

export async function sendCmsReply(input: { apiKey: string; from: string; to: string; subject: string; text: string; idempotencyKey: string }) {
  const resend = new Resend(input.apiKey);
  const { data, error } = await resend.emails.send({
    from: input.from, to: input.to, subject: input.subject, text: input.text,
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</div>`,
    replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined,
  }, { idempotencyKey: input.idempotencyKey });
  if (error || !data?.id) throw new Error(error?.message ?? "Antwoord kon niet worden verzonden.");
  return data.id;
}
