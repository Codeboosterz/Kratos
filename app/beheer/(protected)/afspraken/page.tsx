import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck2, CalendarClock, CalendarDays, Clock3, List, MapPin, RefreshCw, Search, TriangleAlert, UserRoundCheck, X } from "lucide-react";
import { requireCmsMembership } from "@/src/cms/auth";
import { syncCalendlyAppointments } from "./actions";

type PageProps = { searchParams: Promise<{ month?: string; status?: string; count?: string; view?: "month" | "agenda"; query?: string; statusFilter?: "scheduled" | "canceled"; appointment?: string }> };

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });
const appointmentDateFormatter = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", weekday: "short", day: "numeric", month: "short" });
const appointmentTimeFormatter = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" });

function dateKey(date: Date) {
  const parts = dateKeyFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function monthKey(date = new Date()) { const [year, month] = dateKey(date).split("-"); return `${year}-${month}`; }
function addMonths(key: string, amount: number) { const [year, month] = key.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1 + amount, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function calendarHref(values: Record<string, string | undefined>) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(values)) if (value) query.set(key, value); return `/beheer/afspraken?${query}`; }
function statusMessage(status?: string, count?: string) {
  if (status === "synced") return `${count ?? "0"} Calendly-afspraken gesynchroniseerd en de webhook is actief.`;
  if (status === "configuration-required") return "Voeg eerst de drie Calendly-velden toe via Instellingen.";
  if (status === "owner-required") return "Alleen een eigenaar of super admin kan Calendly synchroniseren.";
  if (status === "sync-failed") return "Calendly kon niet worden gesynchroniseerd. Bekijk de integratiekaart voor de precieze fout.";
  return null;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const [params, { supabase, membership }] = await Promise.all([searchParams, requireCmsMembership()]);
  const month = params.month && monthPattern.test(params.month) ? params.month : monthKey();
  const view = params.view === "agenda" ? "agenda" : "month";
  const selectedAppointmentId = params.appointment;
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first); gridStart.setUTCDate(first.getUTCDate() - mondayOffset);
  const gridEnd = new Date(gridStart); gridEnd.setUTCDate(gridStart.getUTCDate() + 42);
  const now = new Date();
  const rangeStart = new Date(Math.min(gridStart.getTime(), now.getTime() - 365 * 24 * 60 * 60_000));
  const rangeEnd = new Date(Math.max(gridEnd.getTime(), now.getTime() + 730 * 24 * 60 * 60_000));

  const [appointmentsResult, waitingResult, connectionResult] = await Promise.all([
    supabase.from("calendar_appointments").select("id, event_name, invitee_name, invitee_email, status, start_time, end_time, location, cancel_url, reschedule_url, intake_reference").gte("start_time", rangeStart.toISOString()).lt("start_time", rangeEnd.toISOString()).order("start_time").limit(1000),
    supabase.from("intake_requests").select("id, customer_name, customer_email, reference, created_at", { count: "exact" }).eq("appointment_status", "awaiting_booking").order("created_at", { ascending: false }).limit(50),
    supabase.from("integration_connections").select("status, last_checked_at, last_error").eq("provider", "calendly").maybeSingle(),
  ]);
  const appointments = appointmentsResult.data ?? [];
  const search = params.query?.trim().toLocaleLowerCase("nl-BE") ?? "";
  const filteredAppointments = appointments.filter((appointment) => {
    if (params.statusFilter && appointment.status !== params.statusFilter) return false;
    if (!search) return true;
    return [appointment.invitee_name, appointment.invitee_email, appointment.event_name, appointment.intake_reference ?? ""].some((value) => value.toLocaleLowerCase("nl-BE").includes(search));
  });
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null;
  const linkedIntakeResult = selectedAppointment?.intake_reference
    ? await supabase.from("intake_requests").select("id, customer_name, reference").eq("reference", selectedAppointment.intake_reference).maybeSingle()
    : { data: null };
  const grouped = new Map<string, typeof filteredAppointments>();
  for (const appointment of filteredAppointments) { const key = dateKey(new Date(appointment.start_time)); grouped.set(key, [...(grouped.get(key) ?? []), appointment]); }
  const days = Array.from({ length: 42 }, (_, index) => { const day = new Date(gridStart); day.setUTCDate(gridStart.getUTCDate() + index); return day; });
  const currentMonthAppointments = filteredAppointments.filter((appointment) => dateKey(new Date(appointment.start_time)).startsWith(month));
  const agendaAppointments = filteredAppointments.filter((appointment) => new Date(appointment.end_time) >= new Date(now.getTime() - 24 * 60 * 60_000)).slice(0, 100);
  const todayCount = grouped.get(dateKey(now))?.filter((item) => item.status === "scheduled").length ?? 0;
  const message = statusMessage(params.status, params.count);
  const monthLabel = new Intl.DateTimeFormat("nl-BE", { month: "long", year: "numeric", timeZone: "Europe/Brussels" }).format(first);
  const ownerCanSync = membership.role !== "editor";
  const schemaReady = !appointmentsResult.error && !waitingResult.error;
  const shared = { month, query: params.query, statusFilter: params.statusFilter };

  return (
    <main className="cms-main cms-main--wide cms-calendar-page">
      <div className="cms-page-heading"><div><span className="eyebrow">Calendly · intakegesprekken</span><h1>Afsprakenkalender.</h1><p>Boekingen, annuleringen en verplaatsingen uit Calendly op één plek. Tijden worden in Europe/Brussels getoond.</p></div><div className="cms-calendar-actions"><Link className="button button--outline" href="/beheer/instellingen">Calendly instellen</Link><form action={syncCalendlyAppointments}><button className="button button--primary" type="submit" disabled={!ownerCanSync || !schemaReady}><RefreshCw aria-hidden="true" /> Synchroniseer</button></form></div></div>
      {message ? <p className={`cms-message ${params.status === "synced" ? "cms-message--success" : "cms-message--error"}`}>{message}</p> : null}
      {!schemaReady ? <div className="cms-operations-alert"><TriangleAlert aria-hidden="true" /><div><strong>Kalendermigratie is nog niet actief</strong><span>Pas de Calendly-migratie toe voordat afspraken worden gesynchroniseerd.</span></div></div> : null}

      <section className="cms-ops-metrics" aria-label="Afsprakenoverzicht"><article><span><CalendarCheck2 aria-hidden="true" /> Deze maand</span><strong>{currentMonthAppointments.filter((item) => item.status === "scheduled").length}</strong><p>bevestigde afspraken</p></article><article><span><CalendarClock aria-hidden="true" /> Vandaag</span><strong>{todayCount}</strong><p>intakegesprekken</p></article><article><span><UserRoundCheck aria-hidden="true" /> Wacht op keuze</span><strong>{waitingResult.count ?? 0}</strong><p>intakes zonder afspraak</p></article><article><span><CalendarDays aria-hidden="true" /> Geannuleerd</span><strong>{currentMonthAppointments.filter((item) => item.status === "canceled").length}</strong><p>deze maand</p></article></section>

      <section className="cms-calendar-toolbar" aria-label="Kalenderfilters">
        <nav><Link href={calendarHref({ ...shared, view: "month" })} className={view === "month" ? "is-active" : ""}><CalendarDays aria-hidden="true" /> Maand</Link><Link href={calendarHref({ ...shared, view: "agenda" })} className={view === "agenda" ? "is-active" : ""}><List aria-hidden="true" /> Agenda</Link></nav>
        <form method="get"><input type="hidden" name="view" value={view} /><input type="hidden" name="month" value={month} /><label><Search aria-hidden="true" /><input name="query" defaultValue={params.query} placeholder="Zoek naam, e-mail of intake" /></label><select name="statusFilter" defaultValue={params.statusFilter ?? ""} aria-label="Afspraakstatus"><option value="">Alle afspraken</option><option value="scheduled">Ingepland</option><option value="canceled">Geannuleerd</option></select><button type="submit">Filter</button>{search || params.statusFilter ? <Link href={calendarHref({ view, month })} aria-label="Filters wissen"><X aria-hidden="true" /></Link> : null}</form>
      </section>

      <section className="cms-calendar-layout">
        {view === "month" ? <article className="cms-panel cms-calendar"><header><Link href={calendarHref({ ...shared, view, month: addMonths(month, -1) })} aria-label="Vorige maand"><ArrowLeft aria-hidden="true" /></Link><div><span>Maandoverzicht</span><h2>{monthLabel}</h2></div><Link href={calendarHref({ ...shared, view, month: addMonths(month, 1) })} aria-label="Volgende maand"><ArrowRight aria-hidden="true" /></Link></header><div className="cms-calendar__weekdays" aria-hidden="true">{["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => <span key={day}>{day}</span>)}</div><div className="cms-calendar__grid">{days.map((day) => { const key = dateKey(day); const dayAppointments = grouped.get(key) ?? []; const outside = day.getUTCMonth() !== monthNumber - 1; const isToday = key === dateKey(now); return <section className={`${outside ? "is-outside" : ""} ${isToday ? "is-today" : ""}`} aria-label={appointmentDateFormatter.format(day)} key={key}><time dateTime={key}>{day.getUTCDate()}</time><div>{dayAppointments.slice(0, 3).map((appointment) => <Link href={calendarHref({ ...shared, view, appointment: appointment.id })} className={`${appointment.status === "canceled" ? "is-canceled" : ""} ${appointment.id === selectedAppointmentId ? "is-selected" : ""}`} key={appointment.id}><b>{appointmentTimeFormatter.format(new Date(appointment.start_time))}</b>{appointment.invitee_name}</Link>)}</div>{dayAppointments.length > 3 ? <small>+{dayAppointments.length - 3} meer</small> : null}</section>; })}</div></article> : <article className="cms-panel cms-calendar-agenda"><header><div><span className="eyebrow">Agendaweergave</span><h2>Komende afspraken</h2></div><strong>{agendaAppointments.length}</strong></header>{agendaAppointments.length ? <ol>{agendaAppointments.map((appointment) => <li className={appointment.id === selectedAppointmentId ? "is-selected" : ""} key={appointment.id}><Link href={calendarHref({ ...shared, view, appointment: appointment.id })}><time dateTime={appointment.start_time}><strong>{appointmentDateFormatter.format(new Date(appointment.start_time))}</strong><span>{appointmentTimeFormatter.format(new Date(appointment.start_time))} – {appointmentTimeFormatter.format(new Date(appointment.end_time))}</span></time><div><strong>{appointment.invitee_name}</strong><span>{appointment.event_name}</span><small>{appointment.invitee_email}</small></div><em className={`is-${appointment.status}`}>{appointment.status}</em></Link></li>)}</ol> : <p className="cms-empty">Geen afspraken voor deze filters.</p>}</article>}

        <aside className="cms-panel cms-calendar-upcoming">
          {selectedAppointment ? <><div className="cms-panel__heading"><div><span className="eyebrow">Afspraakdetails</span><h2>{selectedAppointment.invitee_name}</h2></div><Link href={calendarHref({ ...shared, view })} aria-label="Details sluiten"><X aria-hidden="true" /></Link></div><dl className="cms-appointment-detail"><div><dt>Datum</dt><dd>{appointmentDateFormatter.format(new Date(selectedAppointment.start_time))}</dd></div><div><dt>Tijd</dt><dd>{appointmentTimeFormatter.format(new Date(selectedAppointment.start_time))} – {appointmentTimeFormatter.format(new Date(selectedAppointment.end_time))}</dd></div><div><dt>E-mail</dt><dd><a href={`mailto:${selectedAppointment.invitee_email}`}>{selectedAppointment.invitee_email}</a></dd></div><div><dt>Status</dt><dd>{selectedAppointment.status}</dd></div>{selectedAppointment.location ? <div><dt>Locatie</dt><dd><MapPin aria-hidden="true" /> {selectedAppointment.location}</dd></div> : null}</dl><div className="cms-appointment-actions">{linkedIntakeResult.data ? <Link href={`/beheer/inbox?view=intakes&intake=${linkedIntakeResult.data.id}`}>Bekijk intake {linkedIntakeResult.data.reference}</Link> : null}{selectedAppointment.reschedule_url ? <a href={selectedAppointment.reschedule_url} target="_blank" rel="noreferrer">Verplaatsen in Calendly</a> : null}{selectedAppointment.cancel_url ? <a href={selectedAppointment.cancel_url} target="_blank" rel="noreferrer">Annuleren in Calendly</a> : null}</div></> : <><div className="cms-panel__heading"><div><span className="eyebrow">Selecteer een afspraak</span><h2>Details</h2></div><CalendarClock aria-hidden="true" /></div><p className="cms-empty">Klik op een afspraak om contactgegevens, intake en Calendly-acties te bekijken.</p></>}
          <section className="cms-calendar-waiting" aria-labelledby="waiting-intakes-title"><header><div><span className="eyebrow">Nog niet ingepland</span><h3 id="waiting-intakes-title">Wacht op datum</h3></div><strong>{waitingResult.count ?? 0}</strong></header><p>Dit zijn ontvangen intakes, nog geen afspraken. Zodra Calendly een datum bevestigt, verhuist de klant naar de kalender.</p>{waitingResult.data?.length ? <ol>{waitingResult.data.map((intake) => <li key={intake.id}><Link href={`/beheer/inbox?view=intakes&intake=${intake.id}`}><span><strong>{intake.customer_name}</strong><small>{intake.customer_email}</small></span><time dateTime={intake.created_at}>{new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short", timeZone: "Europe/Brussels" }).format(new Date(intake.created_at))}</time></Link></li>)}</ol> : <small className="cms-empty">Geen intakes die op een datum wachten.</small>}</section>
          <div className="cms-calendar-connection"><Clock3 aria-hidden="true" /><span><strong>{connectionResult.data?.status === "connected" ? "Calendly verbonden" : "Calendly vereist aandacht"}</strong><small>{connectionResult.data?.last_checked_at ? `Laatste sync ${new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(connectionResult.data.last_checked_at))}` : connectionResult.data?.last_error ?? "Nog niet gesynchroniseerd"}</small></span></div>
        </aside>
      </section>
    </main>
  );
}
