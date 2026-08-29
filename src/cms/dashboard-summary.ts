import type { IntegrationState } from "@/src/operations/integrations";

export type DashboardSummaryInput = {
  totalPages: number;
  publishedPages: number;
  totalProducts: number;
  activeProducts: number;
  openOrders: number;
  openThreads: number;
  issueCount: number;
  integrationStates: IntegrationState[];
};

export function percentage(current: number, total: number) {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

export function buildDashboardSummary(input: DashboardSummaryInput) {
  const connectedIntegrations = input.integrationStates.filter((state) => state === "connected").length;
  const integrationsNeedingAttention = input.integrationStates.length - connectedIntegrations;
  const unpublishedPages = Math.max(0, input.totalPages - input.publishedPages);
  const inactiveProducts = Math.max(0, input.totalProducts - input.activeProducts);

  return {
    publicationRate: percentage(input.publishedPages, input.totalPages),
    productActivationRate: percentage(input.activeProducts, input.totalProducts),
    integrationRate: percentage(connectedIntegrations, input.integrationStates.length),
    connectedIntegrations,
    integrationsNeedingAttention,
    attentionCount: unpublishedPages + inactiveProducts + Math.max(0, input.openOrders) + Math.max(0, input.openThreads) + Math.max(0, input.issueCount) + integrationsNeedingAttention,
  };
}

const auditActionLabels: Record<string, string> = {
  "revision.created": "Concept opgeslagen",
  "revision.published": "Versie gepubliceerd",
  "media.created": "Mediabestand toegevoegd",
  "media.updated": "Mediabestand bijgewerkt",
  "media.archived": "Mediabestand gearchiveerd",
  "integration.credential_updated": "Integratiegegevens bijgewerkt",
};

export function formatAuditAction(action: string) {
  const knownLabel = auditActionLabels[action];
  if (knownLabel) return knownLabel;

  const cleaned = action.replaceAll(/[._-]+/g, " ").trim();
  return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : "CMS-wijziging";
}

export function getGreetingForHour(hour: number) {
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function getBelgianGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("nl-BE", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Brussels",
  }).format(date));

  return getGreetingForHour(hour);
}
