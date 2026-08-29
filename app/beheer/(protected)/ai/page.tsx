import { Activity, Bot, CircleDollarSign } from "lucide-react";
import { CmsAiAssistant } from "@/components/cms/ai-assistant";
import { requireCmsMembership } from "@/src/cms/auth";

export default async function AiPage() {
  const { supabase } = await requireCmsMembership();
  const [{ data: jobs }, { data: usage }] = await Promise.all([
    supabase.from("ai_jobs").select("id, job_type, model, status, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("ai_usage_events").select("cost_usd, prompt_tokens, completion_tokens, created_at").order("created_at", { ascending: false }).limit(500),
  ]);
  const totalCost = (usage ?? []).reduce((sum, item) => sum + Number(item.cost_usd), 0);
  const totalTokens = (usage ?? []).reduce((sum, item) => sum + item.prompt_tokens + item.completion_tokens, 0);
  return <main className="cms-main cms-main--wide"><div className="cms-page-heading"><div><span className="eyebrow">Claude via OpenRouter</span><h1>AI & tools.</h1><p>Veilige redactie-assistentie, gebruikslog en menselijke controle. AI krijgt geen publicatie- of rekenrechten.</p></div><span className="cms-health-badge is-healthy"><Bot /> Conceptmodus</span></div><section className="cms-ops-metrics"><article><span><Activity /> Vastgelegde taken</span><strong>{jobs?.length ?? 0}</strong><p>laatste taken zichtbaar</p></article><article><span><CircleDollarSign /> Lokale kostregistratie</span><strong>${totalCost.toFixed(2)}</strong><p>providerreported usage</p></article><article><span><Bot /> Tokens</span><strong>{new Intl.NumberFormat("nl-BE", { notation: "compact" }).format(totalTokens)}</strong><p>prompt + completion</p></article><article><span><Bot /> Publicatierechten</span><strong className="cms-ops-model">Geen</strong><p>altijd menselijke review</p></article></section><CmsAiAssistant /><section className="cms-panel cms-ai-log"><span className="eyebrow">Audittrail</span><h2>Recente AI-taken</h2>{jobs?.length ? <ul>{jobs.map((job) => <li key={job.id}><span>{job.job_type}<small>{job.model}</small></span><strong>{job.status}</strong><time>{new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.created_at))}</time></li>)}</ul> : <p className="cms-empty">Nog geen AI-taken.</p>}</section></main>;
}
