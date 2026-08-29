import { CircleAlert, Download, ReceiptText, RefreshCw, UsersRound } from "lucide-react";
import { requireCmsMembership } from "@/src/cms/auth";
import { resendDigitalDelivery, runTrainerizeProvisioning } from "./actions";

type PageProps = { searchParams: Promise<{ status?: string }> };

function date(value: string | null) { return value ? new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function money(cents: number, currency: string) { return new Intl.NumberFormat("nl-BE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100); }

export default async function OrdersPage({ searchParams }: PageProps) {
  const [{ status }, { supabase, membership }] = await Promise.all([searchParams, requireCmsMembership()]);
  const [{ data: orders, error }, { data: products }, { data: entitlements }, { data: jobs }] = await Promise.all([
    supabase.from("orders").select("id, product_id, customer_email, status, amount_total, currency, paid_at, fulfilled_at, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("cms_products").select("id, name"),
    supabase.from("entitlements").select("order_id, status, download_count, expires_at"),
    supabase.from("trainerize_provisioning_jobs").select("id, order_id, status, attempts, last_error"),
  ]);
  const productMap = new Map((products ?? []).map((product) => [product.id, product.name]));
  const entitlementMap = new Map((entitlements ?? []).map((entitlement) => [entitlement.order_id, entitlement]));
  const jobMap = new Map((jobs ?? []).map((job) => [job.order_id, job]));
  const canOperate = membership.role !== "editor" && !error;
  const feedback = status ? status.replaceAll("-", " ") : null;

  return (
    <main className="cms-main cms-main--wide">
      <div className="cms-page-heading"><div><span className="eyebrow">Fulfillment</span><h1>Bestellingen & toegang.</h1><p>Stripe blijft betalingsbron; Supabase bewaart levering, downloadrechten en herstelacties.</p></div><span className={`cms-health-badge ${error ? "is-warning" : "is-healthy"}`}><ReceiptText aria-hidden="true" />{orders?.length ?? 0} orders</span></div>
      {feedback ? <p className="cms-message">Status: {feedback}.</p> : null}
      {error ? <div className="cms-operations-alert"><CircleAlert aria-hidden="true" /><div><strong>Operations-migratie nodig</strong><span>Bestellingen verschijnen zodra de nieuwe tabellen actief zijn.</span></div></div> : null}
      <section className="cms-order-table" aria-label="Bestellingen">
        <div className="cms-order-table__head"><span>Klant / product</span><span>Bedrag</span><span>Status</span><span>Levering</span><span>Acties</span></div>
        {(orders ?? []).map((order) => {
          const entitlement = entitlementMap.get(order.id); const job = jobMap.get(order.id);
          return <article key={order.id}>
            <div><strong>{order.customer_email}</strong><span>{productMap.get(order.product_id) ?? order.product_id}</span><small>{date(order.paid_at ?? order.created_at)}</small></div>
            <strong>{money(order.amount_total, order.currency)}</strong>
            <span className={`cms-status-pill is-${order.status === "fulfilled" ? "connected" : order.status === "failed" ? "degraded" : "configuration_required"}`}><i />{order.status}</span>
            <div className="cms-order-delivery"><span><Download aria-hidden="true" />{entitlement ? `${entitlement.download_count} downloads` : "Geen PDF-recht"}</span><span><UsersRound aria-hidden="true" />{job ? `Trainerize: ${job.status}` : "Geen provisioning"}</span>{job?.last_error ? <small>{job.last_error}</small> : null}</div>
            <div className="cms-order-actions">
              <form action={resendDigitalDelivery}><input type="hidden" name="orderId" value={order.id} /><button disabled={!canOperate}><RefreshCw aria-hidden="true" /> Nieuwe downloadlink</button></form>
              {job ? <form action={runTrainerizeProvisioning}><input type="hidden" name="jobId" value={job.id} /><button disabled={!canOperate || job.status === "completed"}><UsersRound aria-hidden="true" /> Provisioning uitvoeren</button></form> : null}
            </div>
          </article>;
        })}
        {!orders?.length && !error ? <p className="cms-empty">Nog geen bestellingen.</p> : null}
      </section>
    </main>
  );
}
