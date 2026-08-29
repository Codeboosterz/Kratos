import "server-only";

export type TrainerizeProvisioningInput = { externalId: string; email: string; name?: string | null; planId: string };

export function trainerizeApiConfiguration(apiKeyOverride?: string | null) {
  const apiKey = apiKeyOverride?.trim() || process.env.TRAINERIZE_API_KEY?.trim();
  const createClientUrl = process.env.TRAINERIZE_CLIENT_CREATE_URL?.trim();
  const assignPlanUrl = process.env.TRAINERIZE_PLAN_ASSIGN_URL?.trim();
  return apiKey && createClientUrl && assignPlanUrl ? { apiKey, createClientUrl, assignPlanUrl } : null;
}

async function trainerizePost(url: string, apiKey: string, body: Record<string, unknown>) {
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Trainerize antwoordde met status ${response.status}.`);
  return response.json() as Promise<Record<string, unknown>>;
}

export async function provisionTrainerizeClient(input: TrainerizeProvisioningInput, apiKeyOverride?: string | null) {
  const config = trainerizeApiConfiguration(apiKeyOverride);
  if (!config) return { status: "configuration_required" as const, clientId: null };
  const created = await trainerizePost(config.createClientUrl, config.apiKey, { externalId: input.externalId, email: input.email, name: input.name ?? undefined });
  const clientId = typeof created.id === "string" ? created.id : typeof created.clientId === "string" ? created.clientId : null;
  if (!clientId) throw new Error("Trainerize gaf geen client-ID terug.");
  await trainerizePost(config.assignPlanUrl, config.apiKey, { clientId, planId: input.planId, externalId: input.externalId });
  return { status: "completed" as const, clientId };
}
