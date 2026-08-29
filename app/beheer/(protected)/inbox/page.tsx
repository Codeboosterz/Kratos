import Link from "next/link";
import { CalendarClock, CheckCircle2, Inbox, Mail, MailCheck, MessageSquareReply, Phone, TriangleAlert, UserRound, Workflow } from "lucide-react";
import { goalLabels } from "@/src/domain/products";
import { requireCmsMembership } from "@/src/cms/auth";
import { intakeLeadStatuses, intakeLeadStatusLabels, type IntakeLeadStatus } from "@/src/schemas/intake-lead";
import { markIntakeRead, replyToInboxThread, replyToIntakeLead, updateIntakeLead } from "./actions";

type PageProps = { searchParams: Promise<{ view?: "intakes" | "email"; intake?: string; thread?: string; status?: string; lead?: string; query?: string }> };

const appointmentStatusLabels = { awaiting_booking: "Wacht op datum", scheduled: "Ingepland", canceled: "Geannuleerd" } as const;
function date(value: string) { return new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function intakeHref(id: string, lead?: string, query?: string) {
  const params = new URLSearchParams({ view: "intakes", intake: id });
  if (lead) params.set("lead", lead);
  if (query) params.set("query", query);
  return `/beheer/inbox?${params}`;
}

export default async function InboxPage({ searchParams }: PageProps) {
  const [params, { supabase, membership }] = await Promise.all([searchParams, requireCmsMembership()]);
  const view = params.view === "email" ? "email" : "intakes";
  const leadFilter = intakeLeadStatuses.includes(params.lead as IntakeLeadStatus) ? params.lead as IntakeLeadStatus : "";
  const search = params.query?.trim().toLocaleLowerCase("nl-BE") ?? "";
  const [intakesResult, workflowProbe, threadsResult] = await Promise.all([
    supabase.from("intake_requests").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("intake_requests").select("lead_status", { count: "exact", head: true }),
    supabase.from("email_threads").select("id, customer_email, customer_name, subject, status, last_message_at").order("last_message_at", { ascending: false }).limit(100),
  ]);
  const allIntakes = intakesResult.data ?? [];
  const workflowReady = !intakesResult.error && !workflowProbe.error;
  const filteredIntakes = allIntakes.filter((intake) => {
    const leadStatus = intake.lead_status ?? "new";
    if (leadFilter && leadStatus !== leadFilter) return false;
    if (!search) return true;
    return [intake.customer_name, intake.customer_email, intake.reference, intake.product_slug ?? ""].some((value) => value.toLocaleLowerCase("nl-BE").includes(search));
  });
  const selectedIntake = (params.intake ? allIntakes.find((intake) => intake.id === params.intake) : filteredIntakes[0]) ?? null;
  const references = allIntakes.map((intake) => intake.reference);
  const appointmentsResult = references.length
    ? await supabase.from("calendar_appointments").select("id, event_name, invitee_name, invitee_email, status, start_time, end_time, location, cancel_url, reschedule_url, intake_reference").in("intake_reference", references).order("start_time", { ascending: false })
    : { data: [], error: null };
  const appointmentByReference = new Map<string | null, NonNullable<typeof appointmentsResult.data>[number]>();
  for (const appointment of appointmentsResult.data ?? []) {
    const current = appointmentByReference.get(appointment.intake_reference);
    if (!current || (current.status === "canceled" && appointment.status === "scheduled")) appointmentByReference.set(appointment.intake_reference, appointment);
  }
  const selectedAppointment = selectedIntake ? appointmentByReference.get(selectedIntake.reference) : null;

  const threads = threadsResult.data ?? [];
  const selectedThread = params.thread ? threads.find((thread) => thread.id === params.thread) : threads[0];
  const { data: messages } = view === "email" && selectedThread
    ? await supabase.from("email_messages").select("id, direction, sender, subject, text_body, html_body, delivery_status, created_at").eq("thread_id", selectedThread.id).order("created_at")
    : { data: [] };
  const canManage = membership.role !== "editor" && workflowReady;
  const unreadCount = allIntakes.filter((intake) => !intake.read_at).length;

  return (
    <main className="cms-main cms-main--wide">
      <div className="cms-page-heading"><div><span className="eyebrow">Intakes · Resend inbox</span><h1>Klantopvolging.</h1><p>Nieuwe aanvragen, interne opvolging, e-mailgesprekken en gekoppelde afspraken in één werkstroom.</p></div><span className={`cms-health-badge ${intakesResult.error || threadsResult.error ? "is-warning" : "is-healthy"}`}><Inbox aria-hidden="true" />{unreadCount} ongelezen</span></div>
      <nav className="cms-page-tabs cms-inbox-tabs" aria-label="Inboxweergave">
        <Link href="/beheer/inbox?view=intakes" className={view === "intakes" ? "is-active" : ""}><UserRound aria-hidden="true" /> Intake aanvragen <span>{allIntakes.length}</span></Link>
        <Link href="/beheer/inbox?view=email" className={view === "email" ? "is-active" : ""}><Mail aria-hidden="true" /> E-mailgesprekken <span>{threads.length}</span></Link>
      </nav>
      {params.status ? <p className="cms-message">Status: {params.status.replaceAll("-", " ")}.</p> : null}
      {view === "intakes" && !workflowReady ? <div className="cms-operations-alert"><TriangleAlert aria-hidden="true" /><div><strong>Intake-workflowmigratie vereist</strong><span>De bestaande aanvragen blijven zichtbaar. Pas de nieuwe migratie toe om statussen, gelezen-markering en interne notities te activeren.</span></div></div> : null}

      {view === "intakes" ? (
        <>
          <form className="cms-inbox-filters" method="get"><input type="hidden" name="view" value="intakes" /><label><span>Zoeken</span><input name="query" defaultValue={params.query} placeholder="Naam, e-mail of referentie" /></label><label><span>Leadstatus</span><select name="lead" defaultValue={leadFilter}><option value="">Alle statussen</option>{intakeLeadStatuses.map((item) => <option value={item} key={item}>{intakeLeadStatusLabels[item]}</option>)}</select></label><button type="submit">Filter</button></form>
          <section className="cms-inbox-shell cms-intake-shell">
            <aside className="cms-thread-list cms-intake-list" aria-label="Intake aanvragen">
              {filteredIntakes.map((intake) => {
                const appointment = appointmentByReference.get(intake.reference);
                const leadStatus = (intake.lead_status ?? "new") as IntakeLeadStatus;
                return <Link href={intakeHref(intake.id, leadFilter, params.query)} className={`${selectedIntake?.id === intake.id ? "is-selected" : ""} ${!intake.read_at ? "is-unread" : ""}`} key={intake.id}><span><strong>{intake.customer_name}</strong><small>{intake.customer_email}</small></span><em>{intakeLeadStatusLabels[leadStatus]}</em><span className="cms-intake-list__meta"><time dateTime={intake.created_at}>{date(intake.created_at)}</time><small>{appointment ? appointmentStatusLabels[appointment.status] : appointmentStatusLabels[intake.appointment_status]}</small></span></Link>;
              })}
              {!filteredIntakes.length ? <p className="cms-empty">Geen intakes voor deze filters.</p> : null}
            </aside>
            <article className="cms-conversation cms-intake-detail">
              {selectedIntake ? <>
                <header><div><span>{selectedIntake.reference}</span><h2>{selectedIntake.customer_name}</h2><p>{selectedIntake.customer_email}{selectedIntake.customer_phone ? ` · ${selectedIntake.customer_phone}` : ""}</p></div><span className={`cms-status-pill is-${selectedIntake.appointment_status === "scheduled" ? "connected" : "configuration_required"}`}><i />{appointmentStatusLabels[selectedIntake.appointment_status]}</span></header>
                <div className="cms-intake-detail__body">
                  <section className="cms-intake-facts" aria-label="Intake antwoorden">
                    <div><span>Doel</span><strong>{goalLabels[selectedIntake.goal as keyof typeof goalLabels] ?? selectedIntake.goal}</strong></div><div><span>Ervaring</span><strong>{selectedIntake.experience}</strong></div><div><span>Voorkeur</span><strong>{selectedIntake.training_format.replaceAll("_", " ")}</strong></div><div><span>Beschikbaarheid</span><strong>{selectedIntake.availability}</strong></div><div><span>Traject</span><strong>{selectedIntake.product_slug ?? "Nog te bepalen"}</strong></div><div><span>Bron</span><strong>{selectedIntake.source ?? "Direct"}</strong></div>
                  </section>
                  {selectedIntake.note ? <section className="cms-intake-note"><span>Bericht van klant</span><p>{selectedIntake.note}</p></section> : null}
                  <section className="cms-intake-contact"><a href={`mailto:${selectedIntake.customer_email}`}><Mail aria-hidden="true" /> E-mail openen</a>{selectedIntake.customer_phone ? <a href={`tel:${selectedIntake.customer_phone}`}><Phone aria-hidden="true" /> Bellen</a> : null}</section>
                  <section className="cms-intake-appointment"><div><CalendarClock aria-hidden="true" /><span><strong>{selectedAppointment ? "Afspraak gekoppeld" : "Nog geen afspraak"}</strong><small>{selectedAppointment ? `${date(selectedAppointment.start_time)} · ${selectedAppointment.status}` : "Zodra Calendly is gekoppeld verschijnt de boeking hier automatisch."}</small></span></div>{selectedAppointment ? <Link href={`/beheer/afspraken?appointment=${selectedAppointment.id}`}>Bekijk in kalender</Link> : <Link href="/beheer/afspraken">Open kalender</Link>}</section>
                  <form action={updateIntakeLead} className="cms-intake-workflow"><input type="hidden" name="intakeId" value={selectedIntake.id} /><label><span><Workflow aria-hidden="true" /> Leadstatus</span><select name="leadStatus" defaultValue={selectedIntake.lead_status ?? "new"} disabled={!canManage}>{intakeLeadStatuses.map((item) => <option value={item} key={item}>{intakeLeadStatusLabels[item]}</option>)}</select></label><label><span>Interne notitie</span><textarea name="internalNote" rows={4} maxLength={2000} defaultValue={selectedIntake.internal_note ?? ""} disabled={!canManage} placeholder="Alleen zichtbaar voor het CMS-team." /></label><button type="submit" disabled={!canManage}><CheckCircle2 aria-hidden="true" /> Opvolging opslaan</button></form>
                  {!selectedIntake.read_at ? <form action={markIntakeRead}><input type="hidden" name="intakeId" value={selectedIntake.id} /><button className="cms-intake-read" type="submit" disabled={!canManage}>Markeer als gelezen</button></form> : null}
                  <form action={replyToIntakeLead} className="cms-reply-box cms-intake-reply"><input type="hidden" name="intakeId" value={selectedIntake.id} /><label htmlFor="intake-reply"><MessageSquareReply aria-hidden="true" /> Start e-mailopvolging via Resend</label><textarea id="intake-reply" name="text" rows={5} minLength={2} maxLength={10000} disabled={!canManage} required placeholder={`Hallo ${selectedIntake.customer_name}, bedankt voor je intake…`} /><button type="submit" disabled={!canManage}><MailCheck aria-hidden="true" /> Versturen en gesprek openen</button></form>
                </div>
              </> : <div className="cms-inbox-placeholder"><Inbox aria-hidden="true" /><p>Selecteer een intake.</p></div>}
            </article>
          </section>
        </>
      ) : (
        <section className="cms-inbox-shell">
          <aside className="cms-thread-list" aria-label="Gesprekken">{threads.map((thread) => <Link href={`/beheer/inbox?view=email&thread=${thread.id}`} className={selectedThread?.id === thread.id ? "is-selected" : ""} key={thread.id}><span><strong>{thread.customer_name || thread.customer_email}</strong><small>{thread.subject}</small></span><em>{thread.status}</em><time dateTime={thread.last_message_at}>{date(thread.last_message_at)}</time></Link>)}{!threads.length ? <p className="cms-empty">Nog geen e-mailgesprekken.</p> : null}</aside>
          <article className="cms-conversation">{selectedThread ? <><header><div><span>{selectedThread.customer_email}</span><h2>{selectedThread.subject}</h2></div><span className={`cms-status-pill is-${selectedThread.status === "open" ? "connected" : "configuration_required"}`}><i />{selectedThread.status}</span></header><div className="cms-message-stream">{(messages ?? []).map((message) => <div className={`cms-email-message is-${message.direction}`} key={message.id}><span>{message.direction === "inbound" ? message.sender : "Kratos"}<small>{date(message.created_at)} · {message.delivery_status}</small></span><p>{message.text_body || "HTML-bericht zonder platte tekst."}</p></div>)}</div><form action={replyToInboxThread} className="cms-reply-box"><input type="hidden" name="threadId" value={selectedThread.id} /><label htmlFor="reply"><MessageSquareReply aria-hidden="true" /> Antwoord</label><textarea id="reply" name="text" rows={6} minLength={2} maxLength={10000} disabled={membership.role === "editor" || Boolean(threadsResult.error)} required /><button type="submit" disabled={membership.role === "editor" || Boolean(threadsResult.error)}><MailCheck aria-hidden="true" /> Verzenden via Resend</button></form></> : <div className="cms-inbox-placeholder"><Inbox aria-hidden="true" /><p>Selecteer een gesprek.</p></div>}</article>
        </section>
      )}
    </main>
  );
}
