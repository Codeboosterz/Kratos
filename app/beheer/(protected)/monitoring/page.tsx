import Link from "next/link";
import { ActivitySquare, ArrowRight, Bot, CircleAlert, MailWarning, PlugZap, ReceiptText } from "lucide-react";
import { requireCmsMembership } from "@/src/cms/auth";
import { readMonitorQuery, isConnectionFresh } from "@/src/operations/monitoring";
import { checkoutReasonLabels } from "@/src/operations/checkout-readiness";
import { getCheckoutConfiguration } from "@/src/server/checkout-configuration";
import { integrationDefinitions } from "@/src/operations/integrations";

function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Nog niet gecontroleerd";
}

export default async function MonitoringPage() {
  const { supabase } = await requireCmsMembership();
  const [webhooks, ai, trainerize, email, entitlements, products, integrations] = await Promise.all([
    readMonitorQuery("webhooks", supabase.from("provider_webhook_events").select("provider, provider_event_id, event_type, status, attempts, last_error, received_at").in("status", ["failed", "processing"]).order("received_at", { ascending: false }).limit(40)),
    readMonitorQuery("ai", supabase.from("ai_jobs").select("id, job_type, model, status, error_code, created_at").in("status", ["failed", "running"]).order("created_at", { ascending: false }).limit(20)),
    readMonitorQuery("trainerize", supabase.from("trainerize_provisioning_jobs").select("id, order_id, status, attempts, last_error, updated_at").in("status", ["failed", "running", "queued"]).order("updated_at", { ascending: false }).limit(20)),
    readMonitorQuery("email", supabase.from("email_messages").select("id", { count: "exact", head: true }).in("delivery_status", ["failed", "bounced", "complained", "suppressed"])),
    readMonitorQuery("entitlements", supabase.from("entitlements").select("id", { count: "exact", head: true }).eq("status", "active")),
    readMonitorQuery("products", supabase.from("cms_products").select("id, slug, name, description, status, price_cents, currency, stripe_price_id").neq("status", "archived").order("name")),
    readMonitorQuery("integrations", supabase.from("integration_connections").select("provider, status, last_checked_at").order("provider")),
  ]);
  const failed = [webhooks, ai, trainerize, email, entitlements, products, integrations].filter((query) => query.failed).length;
  const queueIssues = (webhooks.data?.length ?? 0) + (ai.data?.length ?? 0) + (trainerize.data?.length ?? 0) + (email.count ?? 0);
  const readiness = await Promise.all((products.data ?? []).map(async (product) => {
    const config = await getCheckoutConfiguration({ id: product.id, slug: product.slug, name: product.name, summary: product.description, active: product.status === "active", priceCents: product.price_cents, currency: product.currency, stripePriceId: product.stripe_price_id });
    // Only retain safe diagnostics, never the configuration's credentials.
    return { id: product.id, name: product.name, ready: config.ready, reasons: config.ready ? [] : config.reasons };
  }));
  const blocked = readiness.filter((product) => !product.ready).length;
  const incomplete = failed > 0 || blocked > 0 || !readiness.length;
  const providerChecks = integrationDefinitions.map((definition) => {
    const connection = integrations.data?.find((item) => item.provider === definition.id);
    return { ...definition, connection, recent: connection?.status === "connected" && isConnectionFresh(connection.last_checked_at) };
  });
  const providersNeedCheck = providerChecks.some((provider) => !provider.recent);
  const unavailable = <p className="cms-message cms-message--error" role="alert">Controle mislukt. Gegevens zijn onbekend; probeer de pagina opnieuw te laden.</p>;

  return <main className="cms-main cms-main--wide">
    <div className="cms-page-heading">
      <div><span className="eyebrow">Operational control</span><h1>Monitoring & herstel.</h1><p>Wachtrijen, controlefouten en checkoutconfiguratie worden afzonderlijk bewaakt.</p></div>
      <span className={`cms-health-badge ${incomplete || queueIssues || providersNeedCheck ? "is-warning" : "is-healthy"}`}><ActivitySquare />{failed ? "Controle onvolledig" : incomplete ? "Configuratie nodig" : queueIssues ? "Taken vragen aandacht" : providersNeedCheck ? "Providercontroles nodig" : "Geen openstaande meldingen"}</span>
    </div>
    {failed > 0 ? <p className="cms-message cms-message--error" role="alert">{failed} gegevenscontroles konden niet worden uitgevoerd. Een onbekend resultaat is geen gezonde status. Controleer databasebereikbaarheid en rechten.</p> : null}
    <section className="cms-ops-metrics">
      <article><span><PlugZap /> Webhookproblemen</span><strong>{webhooks.failed ? "Onbekend" : webhooks.data?.length ?? 0}</strong><p>failed of processing</p></article>
      <article><span><MailWarning /> E-mailproblemen</span><strong>{email.failed ? "Onbekend" : email.count ?? 0}</strong><p>bounce, klacht of fout</p></article>
      <article><span><Bot /> AI-problemen</span><strong>{ai.failed ? "Onbekend" : ai.data?.length ?? 0}</strong><p>failed of running</p></article>
      <article><span><ReceiptText /> Actieve toegang</span><strong>{entitlements.failed ? "Onbekend" : entitlements.count ?? 0}</strong><p>private PDF-entitlements</p></article>
    </section>
    <section className="cms-panel" aria-labelledby="checkout-readiness-title">
      <div className="cms-panel__heading"><div><span className="eyebrow">Verkoopgereedheid</span><h2 id="checkout-readiness-title">Checkoutconfiguratie</h2></div><ReceiptText /></div>
      <p>Deze controle maakt geen betaling en wijzigt geen prijs. Geldige configuratie is nog geen geverifieerde Stripe-prijs, betaling of levering.</p>
      {products.failed ? unavailable : <>
        <p>{readiness.filter((product) => product.ready).length} van {readiness.length} producten hebben complete checkoutconfiguratie.</p>
        <ul className="cms-monitor-list">{readiness.map((product) => <li key={product.id}><span><strong>{product.name}</strong><small>{product.ready ? "Configuratie compleet — providerprijs en end-to-end acceptatie nog apart controleren" : product.reasons.map((reason) => checkoutReasonLabels[reason]).join(" · ")}</small></span><em>{product.ready ? "Geconfigureerd" : "Niet beschikbaar"}</em></li>)}</ul>
        {!readiness.length ? <p>Geen verkoopbare producten gevonden.</p> : null}
      </>}
      <Link className="button button--outline" href="/beheer/producten">Productkoppelingen beheren</Link>
    </section>
    <section className="cms-panel" aria-labelledby="integration-check-title">
      <h2 id="integration-check-title">Opgeslagen providercontroles</h2><p>Een opgeslagen verbindingscheck is geen live beschikbaarheids- of betaalgarantie. Controles ouder dan 24 uur worden als verouderd gemarkeerd.</p>
      {integrations.failed ? unavailable : <ul className="cms-monitor-list">{providerChecks.map(({ id, name, connection, recent }) => <li key={id}><span><strong>{name}</strong><small>Laatste controle: {date(connection?.last_checked_at ?? null)}</small></span><em>{recent ? "Recent verbonden" : !connection ? "Nog niet gecontroleerd" : !isConnectionFresh(connection.last_checked_at) ? "Opnieuw controleren" : "Configuratie controleren"}</em></li>)}</ul>}
      <Link className="button button--outline" href="/beheer/instellingen">Integraties controleren</Link>
    </section>
    <section className="cms-monitor-grid">
      <article className="cms-panel">
        <div className="cms-panel__heading"><div><span className="eyebrow">Provider events</span><h2>Webhookwachtrij</h2></div><CircleAlert /></div>
        {webhooks.failed ? unavailable : <><ul className="cms-monitor-list">{(webhooks.data ?? []).map((event) => <li key={`${event.provider}-${event.provider_event_id}`}><span><strong>{event.provider} · {event.event_type}</strong><small>{event.last_error || `Poging ${event.attempts}`}</small></span><em>{event.status}</em><time>{date(event.received_at)}</time></li>)}</ul>{!webhooks.data?.length ? <p className="cms-empty">Geen vastgelopen webhooks.</p> : null}</>}
      </article>
      <article className="cms-panel">
        <div className="cms-panel__heading"><div><span className="eyebrow">Provisioning</span><h2>Trainerize & AI</h2></div><Bot /></div>
        {trainerize.failed || ai.failed ? unavailable : null}
        <ul className="cms-monitor-list">{(trainerize.data ?? []).map((job) => <li key={job.id}><span><strong>Trainerize · {job.order_id}</strong><small>{job.last_error || `Poging ${job.attempts}`}</small></span><em>{job.status}</em><time>{date(job.updated_at)}</time></li>)}{(ai.data ?? []).map((job) => <li key={job.id}><span><strong>AI · {job.job_type}</strong><small>{job.error_code || job.model}</small></span><em>{job.status}</em><time>{date(job.created_at)}</time></li>)}</ul>
        {!trainerize.failed && !ai.failed && !trainerize.data?.length && !ai.data?.length ? <p className="cms-empty">Geen openstaande provisioning- of AI-taken.</p> : null}
      </article>
    </section>
    <section className="cms-recovery-links"><Link href="/beheer/bestellingen"><ReceiptText /><span><strong>Fulfillment herstellen</strong><small>Controleer betaalde bestellingen en levering.</small></span><ArrowRight /></Link><Link href="/beheer/inbox"><MailWarning /><span><strong>E-mail opvolgen</strong><small>Bekijk bounces en klantvragen.</small></span><ArrowRight /></Link></section>
  </main>;
}
