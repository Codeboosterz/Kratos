import { Activity, ArrowUpRight, CheckCircle2, CircleDollarSign, KeyRound, PlugZap, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { requireCmsMembership } from "@/src/cms/auth";
import { integrationDefinitions, type IntegrationId, type IntegrationState } from "@/src/operations/integrations";
import { getOpenRouterOverview } from "@/src/operations/openrouter";
import { environmentCredentialName, resolveIntegrationSecret } from "@/src/operations/secrets";
import { saveIntegrationCredential, testIntegration } from "./actions";

type PageProps = { searchParams: Promise<{ status?: string; provider?: string }> };
type ConnectionRow = { provider: IntegrationId; status: IntegrationState; last_checked_at: string | null; last_error: string | null };

const stateLabels: Record<IntegrationState, string> = {
  connected: "Verbonden",
  not_connected: "Niet verbonden",
  configuration_required: "Configuratie nodig",
  permission_expired: "Toegang verlopen",
  degraded: "Aandacht nodig",
};

function money(value: number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("nl-BE", { style: "currency", currency: "USD" }).format(value);
}

function formatCheckedAt(value: string | null) {
  return value ? new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Nog niet gecontroleerd";
}

function statusMessage(status?: string, provider?: string) {
  if (status === "saved") return `${provider ?? "Integratie"}: credential veilig opgeslagen. Test de verbinding om de status te bevestigen.`;
  if (status === "connected") return `${provider ?? "Integratie"} is bereikbaar en gecontroleerd.`;
  if (status === "connection-failed") return `${provider ?? "Integratie"} kon niet volledig worden gecontroleerd. Bekijk de providerkaart.`;
  if (status === "super-admin-required") return "Alleen de super admin mag API-credentials wijzigen.";
  if (status) return "De actie kon niet worden afgerond. Controleer de invoer en migratiestatus.";
  return null;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const [{ status, provider }, { supabase, membership }] = await Promise.all([searchParams, requireCmsMembership()]);
  const [{ data: rows, error: connectionError }, { data: refs, error: refsError }] = await Promise.all([
    supabase.from("integration_connections").select("provider, status, last_checked_at, last_error").order("provider"),
    membership.role === "super_admin"
      ? supabase.from("integration_secret_refs").select("provider, credential_name")
      : Promise.resolve({ data: [], error: null }),
  ]);
  const connectionRows = (rows ?? []) as ConnectionRow[];
  const refsSet = new Set((refs ?? []).map((reference) => `${reference.provider}:${reference.credential_name}`));
  const openRouterRow = connectionRows.find((row) => row.provider === "openrouter");

  let telemetry: Awaited<ReturnType<typeof getOpenRouterOverview>> = {
    status: "configuration_required", credits: null, keyUsage: null, checkedAt: null, error: null,
  };
  if (!connectionError) {
    try {
      const [apiKey, managementKey] = await Promise.all([
        resolveIntegrationSecret("openrouter", "api_key"),
        resolveIntegrationSecret("openrouter", "management_key"),
      ]);
      telemetry = await getOpenRouterOverview({ apiKey, managementKey });
    } catch (error) {
      telemetry = { status: "degraded", credits: null, keyUsage: null, checkedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Usage ophalen mislukt." };
    }
  }

  const configuredCount = connectionRows.filter((row) => row.status === "connected").length;
  const message = statusMessage(status, provider);
  const schemaReady = !connectionError && !refsError;

  return (
    <main className="cms-main cms-main--wide cms-operations">
      <div className="cms-page-heading">
        <div><span className="eyebrow">Operations hub</span><h1>Integraties & gezondheid.</h1><p>API-slots, verbindingstests en kosteninzicht. Geheime waarden worden alleen write-only opgeslagen in Supabase Vault.</p></div>
        <span className={`cms-health-badge ${schemaReady ? "is-healthy" : "is-warning"}`}><ShieldCheck aria-hidden="true" /> {schemaReady ? "Datalaag gereed" : "Migratie nodig"}</span>
      </div>

      {message ? <p className={`cms-message ${status?.includes("failed") || status?.includes("required") ? "cms-message--error" : "cms-message--success"}`}>{message}</p> : null}
      {!schemaReady ? <div className="cms-operations-alert"><TriangleAlert aria-hidden="true" /><div><strong>Operations-migratie is nog niet actief</strong><span>Pas eerst de nieuwe Supabase-migratie toe. Tot die tijd blijven alle formulieren veilig zonder effect.</span></div></div> : null}

      <section className="cms-ops-metrics" aria-label="Integratie-overzicht">
        <article><span><PlugZap aria-hidden="true" /> Verbonden</span><strong>{configuredCount}<small>/ {integrationDefinitions.length}</small></strong><p>actief gecontroleerde providers</p></article>
        <article><span><CircleDollarSign aria-hidden="true" /> OpenRouter tegoed</span><strong>{money(telemetry.credits?.remainingCreditsUsd)}</strong><p>{telemetry.credits ? `${money(telemetry.credits.totalUsageUsd)} totaal gebruikt` : "Management key vereist"}</p></article>
        <article><span><Activity aria-hidden="true" /> Deze maand</span><strong>{money(telemetry.keyUsage?.monthlyUsageUsd)}</strong><p>{telemetry.keyUsage?.limitUsd ? `${money(telemetry.keyUsage.remainingLimitUsd)} keylimiet over` : "Geen keylimiet gemeld"}</p></article>
        <article><span><KeyRound aria-hidden="true" /> AI-model</span><strong className="cms-ops-model">Claude<br />4.6</strong><p>server-side structured output</p></article>
      </section>

      <section className="cms-operations-grid">
        {integrationDefinitions.map((definition) => {
          const connection = connectionRows.find((row) => row.provider === definition.id);
          const state = connection?.status ?? "configuration_required";
          return (
            <article className="cms-integration-card" key={definition.id}>
              <header>
                <div className={`cms-provider-mark cms-provider-mark--${definition.id}`}>{definition.name.slice(0, 2).toUpperCase()}</div>
                <div><h2>{definition.name}</h2><p>{definition.description}</p></div>
                <span className={`cms-status-pill is-${state}`}><i />{stateLabels[state]}</span>
              </header>
              <div className="cms-capability-row">{definition.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
              {connection?.last_error ? <p className="cms-provider-error"><TriangleAlert aria-hidden="true" />{connection.last_error}</p> : null}
              <div className="cms-provider-meta"><span>{formatCheckedAt(connection?.last_checked_at ?? null)}</span>{state === "connected" ? <CheckCircle2 aria-hidden="true" /> : <Activity aria-hidden="true" />}</div>

              <details className="cms-credential-panel">
                <summary>API-slots beheren <ArrowUpRight aria-hidden="true" /></summary>
                <div>
                  {definition.credentials.map((credential) => {
                    const envName = environmentCredentialName(definition.id, credential.name);
                    const configured = refsSet.has(`${definition.id}:${credential.name}`) || Boolean(envName && process.env[envName]?.trim());
                    return (
                      <form action={saveIntegrationCredential} className="cms-credential-form" key={credential.name}>
                        <input type="hidden" name="provider" value={definition.id} />
                        <input type="hidden" name="credentialName" value={credential.name} />
                        <label htmlFor={`${definition.id}-${credential.name}`}><span>{credential.label}<small>{configured ? "Ingesteld" : "Ontbreekt"}</small></span><em>{credential.helper}</em></label>
                        <div><input id={`${definition.id}-${credential.name}`} name="value" type={credential.secret ? "password" : "url"} minLength={8} maxLength={8192} autoComplete={credential.secret ? "new-password" : "url"} placeholder={configured ? "Vervang opgeslagen waarde" : credential.secret ? "Plak API-waarde" : "https://calendly.com/..."} disabled={membership.role !== "super_admin" || !schemaReady} required /><button type="submit" disabled={membership.role !== "super_admin" || !schemaReady}>Opslaan</button></div>
                      </form>
                    );
                  })}
                  {definition.id === "trainerize" ? <p className="cms-config-note">Trainerize vereist daarnaast <code>TRAINERIZE_HEALTH_URL</code> en geverifieerde endpointtemplates voor jouw Studio/Enterprise-account.</p> : null}
                  {definition.id === "calendly" ? <p className="cms-config-note">Na opslaan activeert <strong>Synchroniseer</strong> op de pagina Afspraken automatisch de ondertekende webhook op <code>/api/calendly/webhook</code>.</p> : null}
                </div>
              </details>
              <form action={testIntegration} className="cms-test-connection"><input type="hidden" name="provider" value={definition.id} /><button type="submit" disabled={membership.role !== "super_admin" || !schemaReady}><RefreshCw aria-hidden="true" /> Verbinding testen</button></form>
            </article>
          );
        })}
      </section>

      <section className="cms-panel cms-usage-panel">
        <div><span className="eyebrow">OpenRouter usage</span><h2>Budget zonder verrassingen.</h2><p>Credits komen van de management key; keylimieten van de inference key. Geen geheim verlaat de server.</p></div>
        <dl>
          <div><dt>Totaal gekocht</dt><dd>{money(telemetry.credits?.totalCreditsUsd)}</dd></div>
          <div><dt>Totaal gebruikt</dt><dd>{money(telemetry.credits?.totalUsageUsd)}</dd></div>
          <div><dt>Vandaag</dt><dd>{money(telemetry.keyUsage?.dailyUsageUsd)}</dd></div>
          <div><dt>Deze week</dt><dd>{money(telemetry.keyUsage?.weeklyUsageUsd)}</dd></div>
        </dl>
        <small>{telemetry.error ?? (openRouterRow?.last_checked_at ? `Laatste opgeslagen controle: ${formatCheckedAt(openRouterRow.last_checked_at)}` : "Voeg beide OpenRouter-sleutels toe voor live gebruiksinzicht.")}</small>
      </section>
    </main>
  );
}
