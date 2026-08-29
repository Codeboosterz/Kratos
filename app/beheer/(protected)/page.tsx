import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  Files,
  ImageIcon,
  Inbox,
  PlugZap,
  Radio,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { requireCmsMembership } from "@/src/cms/auth";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { buildDashboardSummary, formatAuditAction, getBelgianGreeting } from "@/src/cms/dashboard-summary";
import { combineMediaStats, formatMediaSize } from "@/src/cms/media-stats";
import { integrationDefinitions, type IntegrationId, type IntegrationState } from "@/src/operations/integrations";

type IntegrationRow = {
  provider: IntegrationId;
  status: IntegrationState;
  last_checked_at: string | null;
  last_error: string | null;
};

const stateLabels: Record<IntegrationState, string> = {
  connected: "Verbonden",
  not_connected: "Niet verbonden",
  configuration_required: "Configuratie nodig",
  permission_expired: "Toegang verlopen",
  degraded: "Aandacht nodig",
};

const providerIcons = {
  stripe: ReceiptText,
  resend: Inbox,
  trainerize: ShieldCheck,
  openrouter: Bot,
  calendly: CalendarDays,
} satisfies Record<IntegrationId, typeof ReceiptText>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  }).format(new Date(value));
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function CmsDashboardPage() {
  const { supabase, membership } = await requireCmsMembership();
  const [
    pagesResult,
    revisionsResult,
    mediaResult,
    productsResult,
    ordersResult,
    threadsResult,
    integrationsResult,
    webhooksResult,
    failedMailResult,
    trainerizeResult,
    aiResult,
    eventsResult,
  ] = await Promise.all([
    supabase.from("content_pages").select("id, published_revision_id"),
    supabase.from("content_revisions").select("id, status"),
    supabase.from("media_assets").select("size_bytes").is("archived_at", null),
    supabase.from("cms_products").select("id, status"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid", "failed"]),
    supabase.from("email_threads").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("integration_connections").select("provider, status, last_checked_at, last_error").order("provider"),
    supabase.from("provider_webhook_events").select("provider", { count: "exact", head: true }).in("status", ["failed", "processing"]),
    supabase.from("email_messages").select("id", { count: "exact", head: true }).in("delivery_status", ["failed", "bounced", "complained", "suppressed"]),
    supabase.from("trainerize_provisioning_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "running", "queued"]),
    supabase.from("ai_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "running"]),
    supabase.from("cms_audit_events").select("id, action, object_type, created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const pages = pagesResult.data ?? [];
  const revisions = revisionsResult.data ?? [];
  const products = productsResult.data ?? [];
  const integrations = (integrationsResult.data ?? []) as IntegrationRow[];
  const media = combineMediaStats(
    mediaResult.data?.length ?? 0,
    mediaResult.data?.reduce((total, asset) => total + Number(asset.size_bytes), 0) ?? 0,
  );
  const issueCount = (webhooksResult.count ?? 0) + (failedMailResult.count ?? 0) + (trainerizeResult.count ?? 0) + (aiResult.count ?? 0);
  const publishedPages = pages.filter((page) => Boolean(page.published_revision_id)).length;
  const activeProducts = products.filter((product) => product.status === "active").length;
  const summary = buildDashboardSummary({
    totalPages: pages.length,
    publishedPages,
    totalProducts: products.length,
    activeProducts,
    openOrders: ordersResult.count ?? 0,
    openThreads: threadsResult.count ?? 0,
    issueCount,
    integrationStates: integrations.map((integration) => integration.status),
  });
  const queryErrorCount = [
    pagesResult.error,
    revisionsResult.error,
    mediaResult.error,
    productsResult.error,
    ordersResult.error,
    threadsResult.error,
    integrationsResult.error,
    webhooksResult.error,
    failedMailResult.error,
    trainerizeResult.error,
    aiResult.error,
    eventsResult.error,
  ].filter(Boolean).length;
  const ownerName = membership.display_name || (membership.role === "super_admin" ? "Super Admin" : "Omar");
  const progressItems = [
    { label: "Websitepagina’s", value: summary.publicationRate, detail: `${publishedPages} van ${pages.length} gepubliceerd`, href: "/beheer/website" },
    { label: "Producten", value: summary.productActivationRate, detail: `${activeProducts} van ${products.length} actief`, href: "/beheer/producten" },
    { label: "Integraties", value: summary.integrationRate, detail: `${summary.connectedIntegrations} van ${integrations.length} verbonden`, href: "/beheer/instellingen" },
  ];

  const focusItems = [
    { label: "Integraties configureren", count: summary.integrationsNeedingAttention, detail: "API-slots en verbindingstests", href: "/beheer/instellingen", icon: PlugZap },
    { label: "Pagina’s publiceren", count: Math.max(0, pages.length - publishedPages), detail: "Nog niet gekoppeld aan een live versie", href: "/beheer/website", icon: Files },
    { label: "Producten activeren", count: Math.max(0, products.length - activeProducts), detail: "Prijs, PDF en levering afronden", href: "/beheer/producten", icon: Boxes },
    { label: "Klantgesprekken", count: threadsResult.count ?? 0, detail: "Open gesprekken in Resend inbox", href: "/beheer/inbox", icon: Inbox },
  ];

  return (
    <main className="cms-main cms-main--wide cms-overview">
      <section className="cms-overview-heading" aria-labelledby="cms-overview-title">
        <div>
          <span className="eyebrow">Kratos beheer · live overzicht</span>
          <h1 id="cms-overview-title">{getBelgianGreeting()}, {ownerName}.</h1>
          <p>Publicatie, media, verkoop en integraties — verbonden met de actuele CMS-data.</p>
        </div>
        <div className="cms-overview-actions">
          <Link className="button button--primary" href="/beheer/website">Website aanpassen <ArrowRight aria-hidden="true" /></Link>
          <Link className="button button--outline" href="/" target="_blank">Bekijk website <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>

      {queryErrorCount ? (
        <div className="cms-overview-alert" role="status">
          <CircleAlert aria-hidden="true" />
          <span>{countLabel(queryErrorCount, "databron kon", "databronnen konden")} niet volledig worden gelezen. Controleer monitoring voor details.</span>
          <Link href="/beheer/monitoring">Open monitoring <ArrowRight aria-hidden="true" /></Link>
        </div>
      ) : null}

      <section className="cms-overview-kpis" aria-label="Belangrijkste CMS-statistieken">
        <Link className="cms-kpi-card is-primary" href="/beheer/media">
          <span><ImageIcon aria-hidden="true" /> Websitebestanden</span>
          <strong>{media.count}</strong>
          <small>{formatMediaSize(media.sizeBytes)} actief gebruikt</small>
          <ArrowUpRight className="cms-kpi-card__arrow" aria-hidden="true" />
        </Link>
        <Link className="cms-kpi-card" href="/beheer/website">
          <span><FileCheck2 aria-hidden="true" /> Gepubliceerde pagina’s</span>
          <strong>{publishedPages}<em>/ {pages.length}</em></strong>
          <small>{summary.publicationRate}% van het geregistreerde aanbod</small>
          <ArrowUpRight className="cms-kpi-card__arrow" aria-hidden="true" />
        </Link>
        <Link className="cms-kpi-card" href="/beheer/producten">
          <span><Boxes aria-hidden="true" /> Actieve producten</span>
          <strong>{activeProducts}<em>/ {products.length}</em></strong>
          <small>{activeProducts ? "Beschikbaar voor verkoop" : "Nog geen product live"}</small>
          <ArrowUpRight className="cms-kpi-card__arrow" aria-hidden="true" />
        </Link>
        <Link className="cms-kpi-card" href="#focus-title">
          <span><CircleAlert aria-hidden="true" /> Open acties</span>
          <strong>{summary.attentionCount}</strong>
          <small>Werkvoorraad voor content, producten en integraties</small>
          <ArrowUpRight className="cms-kpi-card__arrow" aria-hidden="true" />
        </Link>
      </section>

      <section className="cms-overview-board" aria-label="CMS voortgang en integraties">
        <article className="cms-overview-panel cms-publishing-panel">
          <header>
            <div><span className="eyebrow">Contentstatus</span><h2>Publicatievoortgang</h2></div>
            <Link href="/beheer/website">Open websitebeheer <ArrowRight aria-hidden="true" /></Link>
          </header>
          <div className="cms-progress-stack">
            {progressItems.map((item) => (
              <Link className="cms-progress-row" href={item.href} key={item.label}>
                <AnimatedCircularProgressBar className="is-compact" min={0} max={100} value={item.value} gaugePrimaryColor="var(--lime-bright)" gaugeSecondaryColor="rgba(244, 246, 239, .1)" label={`${item.label}: ${item.value}%`} />
                <div><strong>{item.label}</strong><span>{item.detail}</span></div>
              </Link>
            ))}
          </div>
          <div className="cms-publishing-footnote">
            <Sparkles aria-hidden="true" />
            <p><strong>{countLabel(revisions.length, "opgeslagen versie", "opgeslagen versies")}</strong><span>{revisions.filter((revision) => revision.status === "draft").length} concepten wachten op publicatie.</span></p>
          </div>
        </article>

        <article className="cms-overview-panel cms-integrations-panel">
          <header>
            <div><span className="eyebrow">API-status</span><h2>Integraties</h2></div>
            <Link href="/beheer/instellingen" aria-label="Open integratie-instellingen"><Settings2 aria-hidden="true" /></Link>
          </header>
          <ul>
            {integrationDefinitions.map((definition) => {
              const row = integrations.find((integration) => integration.provider === definition.id);
              const state = row?.status ?? "configuration_required";
              const Icon = providerIcons[definition.id];
              return (
                <li key={definition.id}>
                  <Icon aria-hidden="true" />
                  <span><strong>{definition.name}</strong><small>{row?.last_checked_at ? `Getest ${formatDate(row.last_checked_at)}` : "Nog niet getest"}</small></span>
                  <span className={`cms-status-pill is-${state}`}><i />{stateLabels[state]}</span>
                </li>
              );
            })}
          </ul>
          <Link className="cms-panel-link" href="/beheer/instellingen">API-slots en verbindingen beheren <ArrowRight aria-hidden="true" /></Link>
        </article>

        <article className="cms-overview-panel cms-activity-panel">
          <header>
            <div><span className="eyebrow">Audittrail</span><h2>Recente wijzigingen</h2></div>
            <Clock3 aria-hidden="true" />
          </header>
          {eventsResult.data?.length ? (
            <ul>
              {eventsResult.data.map((event) => (
                <li key={event.id}>
                  <span className="cms-activity-marker" aria-hidden="true" />
                  <span><strong>{formatAuditAction(event.action)}</strong><small>{event.object_type}</small></span>
                  <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cms-overview-empty">
              <Radio aria-hidden="true" />
              <div><strong>Nog geen recente wijzigingen</strong><p>Nieuwe concepten, publicaties en configuratiewijzigingen verschijnen hier automatisch.</p></div>
              <Link href="/beheer/website">Start met bewerken <ArrowRight aria-hidden="true" /></Link>
            </div>
          )}
        </article>

        <article className="cms-overview-panel cms-readiness-panel">
          <header><div><span className="eyebrow">Operationele basis</span><h2>Integratiegraad</h2></div><CheckCircle2 aria-hidden="true" /></header>
          <div className="cms-readiness-content">
            <AnimatedCircularProgressBar className="is-large" min={0} max={100} value={summary.integrationRate} gaugePrimaryColor="var(--lime-bright)" gaugeSecondaryColor="#2a2f28" label="Verbonden integraties" caption="verbonden" />
            <div className="cms-readiness-legend">
              <span><i className="is-connected" />{summary.connectedIntegrations} verbonden</span>
              <span><i className="is-pending" />{summary.integrationsNeedingAttention} te configureren</span>
              <span><i className="is-issue" />{issueCount} operationele fouten</span>
            </div>
          </div>
          <Link className="cms-panel-link" href="/beheer/monitoring">Bekijk monitoring en herstel <ArrowRight aria-hidden="true" /></Link>
        </article>
      </section>

      <section className="cms-overview-panel cms-focus-panel" aria-labelledby="focus-title">
        <header>
          <div><span className="eyebrow">Volgende acties</span><h2 id="focus-title">Werkvoorraad</h2></div>
          <span>{focusItems.reduce((total, item) => total + item.count, 0)} open</span>
        </header>
        <div className="cms-focus-grid">
          {focusItems.map(({ label, count, detail, href, icon: Icon }) => (
            <Link href={href} key={label}>
              <Icon aria-hidden="true" />
              <span><strong>{label}</strong><small>{detail}</small></span>
              <em>{count}</em>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
