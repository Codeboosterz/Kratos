"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCmsMembership } from "@/src/cms/auth";
import { sendCmsReply } from "@/src/operations/resend";
import { resolveIntegrationSecret } from "@/src/operations/secrets";
import { markIntakeReadSchema, updateIntakeLeadSchema } from "@/src/schemas/intake-lead";
import { createAdminClient } from "@/src/supabase/admin";

const replySchema = z.object({ threadId: z.uuid(), text: z.string().trim().min(2).max(10_000) });
const intakeReplySchema = z.object({ intakeId: z.uuid(), text: z.string().trim().min(2).max(10_000) });

function intakeResultUrl(intakeId: string, status: string) {
  const query = new URLSearchParams({ view: "intakes", intake: intakeId, status });
  return `/beheer/inbox?${query}`;
}

export async function markIntakeRead(formData: FormData) {
  const { supabase, userId, membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/inbox?view=intakes&status=owner-required");
  const parsed = markIntakeReadSchema.safeParse({ intakeId: formData.get("intakeId") });
  if (!parsed.success) redirect("/beheer/inbox?view=intakes&status=invalid-intake");
  const now = new Date().toISOString();
  const { error } = await supabase.from("intake_requests").update({ read_at: now, read_by: userId, updated_at: now }).eq("id", parsed.data.intakeId);
  if (error) redirect(intakeResultUrl(parsed.data.intakeId, "update-failed"));
  revalidatePath("/beheer");
  revalidatePath("/beheer/inbox");
  redirect(intakeResultUrl(parsed.data.intakeId, "read"));
}

export async function updateIntakeLead(formData: FormData) {
  const { supabase, userId, membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/inbox?view=intakes&status=owner-required");
  const parsed = updateIntakeLeadSchema.safeParse({
    intakeId: formData.get("intakeId"),
    leadStatus: formData.get("leadStatus"),
    internalNote: formData.get("internalNote"),
  });
  if (!parsed.success) redirect("/beheer/inbox?view=intakes&status=invalid-intake");
  const now = new Date().toISOString();
  const { error } = await supabase.from("intake_requests").update({
    lead_status: parsed.data.leadStatus,
    internal_note: parsed.data.internalNote,
    read_at: now,
    read_by: userId,
    updated_at: now,
  }).eq("id", parsed.data.intakeId);
  if (error) redirect(intakeResultUrl(parsed.data.intakeId, "update-failed"));
  try {
    const admin = createAdminClient();
    await admin.from("cms_audit_events").insert({
      actor_id: userId,
      action: "intake.workflow_updated",
      object_type: "intake_request",
      object_id: parsed.data.intakeId,
      metadata: { lead_status: parsed.data.leadStatus },
    });
  } catch { /* The workflow update is authoritative even if audit persistence is temporarily unavailable. */ }
  revalidatePath("/beheer");
  revalidatePath("/beheer/inbox");
  redirect(intakeResultUrl(parsed.data.intakeId, "updated"));
}

export async function replyToIntakeLead(formData: FormData) {
  const { userId, membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/inbox?view=intakes&status=owner-required");
  const parsed = intakeReplySchema.safeParse({ intakeId: formData.get("intakeId"), text: formData.get("text") });
  if (!parsed.success) redirect("/beheer/inbox?view=intakes&status=invalid-reply");
  const [apiKey, from] = await Promise.all([
    resolveIntegrationSecret("resend", "api_key").catch(() => null),
    Promise.resolve(process.env.RESEND_FROM_EMAIL?.trim()),
  ]);
  if (!apiKey || !from) redirect(intakeResultUrl(parsed.data.intakeId, "resend-config-required"));

  const admin = createAdminClient();
  const { data: intake } = await admin.from("intake_requests").select("id, reference, customer_email, customer_name").eq("id", parsed.data.intakeId).maybeSingle();
  if (!intake) redirect("/beheer/inbox?view=intakes&status=intake-not-found");
  const subject = `Opvolging intake ${intake.reference}`;
  const { data: existingThread } = await admin.from("email_threads").select("id").eq("customer_email", intake.customer_email).eq("subject", subject).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const idempotencyKey = createHash("sha256").update(`${intake.id}:${parsed.data.text}`).digest("hex");

  let sentThreadId = "";
  try {
    const providerId = await sendCmsReply({ apiKey, from, to: intake.customer_email, subject, text: parsed.data.text, idempotencyKey });
    let threadId = existingThread?.id;
    if (!threadId) {
      const { data: createdThread, error: threadError } = await admin.from("email_threads").insert({
        customer_email: intake.customer_email,
        customer_name: intake.customer_name,
        subject,
        status: "waiting",
        last_message_at: new Date().toISOString(),
      }).select("id").single();
      if (threadError || !createdThread) throw new Error(threadError?.message ?? "E-mailthread kon niet worden opgeslagen.");
      threadId = createdThread.id;
    }
    const now = new Date().toISOString();
    const { error: messageError } = await admin.from("email_messages").insert({
      thread_id: threadId,
      provider_message_id: providerId,
      direction: "outbound",
      sender: from,
      recipients: [intake.customer_email],
      subject,
      text_body: parsed.data.text,
      delivery_status: "sent",
    });
    if (messageError) throw new Error(messageError.message);
    await Promise.all([
      admin.from("email_threads").update({ status: "waiting", last_message_at: now }).eq("id", threadId),
      admin.from("intake_requests").update({ lead_status: "contacted", read_at: now, read_by: userId, updated_at: now }).eq("id", intake.id),
      admin.from("cms_audit_events").insert({
        actor_id: userId,
        action: "intake.email_started",
        object_type: "intake_request",
        object_id: intake.id,
        metadata: { thread_id: threadId },
      }),
    ]);
    sentThreadId = threadId;
  } catch {
    redirect(intakeResultUrl(intake.id, "send-failed"));
  }
  revalidatePath("/beheer");
  revalidatePath("/beheer/inbox");
  redirect(`/beheer/inbox?view=email&thread=${sentThreadId}&status=sent`);
}

export async function replyToInboxThread(formData: FormData) {
  const { membership } = await requireCmsMembership();
  if (membership.role === "editor") redirect("/beheer/inbox?view=email&status=owner-required");
  const parsed = replySchema.safeParse({ threadId: formData.get("threadId"), text: formData.get("text") });
  if (!parsed.success) redirect("/beheer/inbox?view=email&status=invalid-reply");
  const [apiKey, from] = await Promise.all([resolveIntegrationSecret("resend", "api_key").catch(() => null), Promise.resolve(process.env.RESEND_FROM_EMAIL?.trim())]);
  if (!apiKey || !from) redirect(`/beheer/inbox?view=email&thread=${parsed.data.threadId}&status=resend-config-required`);
  const admin = createAdminClient();
  const { data: thread } = await admin.from("email_threads").select("id, customer_email, subject").eq("id", parsed.data.threadId).maybeSingle();
  if (!thread) redirect("/beheer/inbox?view=email&status=thread-not-found");
  const idempotencyKey = createHash("sha256").update(`${thread.id}:${parsed.data.text}:${randomUUID()}`).digest("hex");
  try {
    const providerId = await sendCmsReply({ apiKey, from, to: thread.customer_email, subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`, text: parsed.data.text, idempotencyKey });
    await Promise.all([
      admin.from("email_messages").insert({ thread_id: thread.id, provider_message_id: providerId, direction: "outbound", sender: from, recipients: [thread.customer_email], subject: `Re: ${thread.subject}`, text_body: parsed.data.text, delivery_status: "sent" }),
      admin.from("email_threads").update({ status: "waiting", last_message_at: new Date().toISOString() }).eq("id", thread.id),
    ]);
  } catch { redirect(`/beheer/inbox?view=email&thread=${thread.id}&status=send-failed`); }
  revalidatePath("/beheer/inbox");
  redirect(`/beheer/inbox?view=email&thread=${thread.id}&status=sent`);
}
