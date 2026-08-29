import { describe, expect, it } from "vitest";
import {
  buildDashboardSummary,
  formatAuditAction,
  getGreetingForHour,
  percentage,
} from "@/src/cms/dashboard-summary";

describe("CMS dashboard summary", () => {
  it("derives honest rates and attention counts from live data", () => {
    expect(buildDashboardSummary({
      totalPages: 9,
      publishedPages: 1,
      totalProducts: 8,
      activeProducts: 0,
      openOrders: 2,
      openThreads: 1,
      issueCount: 3,
      integrationStates: ["connected", "configuration_required", "degraded", "not_connected"],
    })).toEqual({
      publicationRate: 11,
      productActivationRate: 0,
      integrationRate: 25,
      connectedIntegrations: 1,
      integrationsNeedingAttention: 3,
      attentionCount: 25,
    });
  });

  it("keeps percentages safe for empty and over-complete inputs", () => {
    expect(percentage(1, 0)).toBe(0);
    expect(percentage(15, 10)).toBe(100);
    expect(percentage(-1, 10)).toBe(0);
  });

  it("turns audit event keys into human labels", () => {
    expect(formatAuditAction("revision.published")).toBe("Versie gepubliceerd");
    expect(formatAuditAction("integration.credential_updated")).toBe("Integratiegegevens bijgewerkt");
    expect(formatAuditAction("custom.action_name")).toBe("Custom action name");
  });

  it("uses a time-aware Dutch greeting", () => {
    expect(getGreetingForHour(8)).toBe("Goedemorgen");
    expect(getGreetingForHour(14)).toBe("Goedemiddag");
    expect(getGreetingForHour(20)).toBe("Goedenavond");
  });
});
