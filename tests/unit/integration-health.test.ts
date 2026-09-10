import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ balance: vi.fn(), resolve: vi.fn() }));
vi.mock("stripe", () => ({ default: class { balance = { retrieve: mocks.balance }; } }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.resolve }));
import { checkIntegrationConnection } from "@/src/operations/health";

describe("provider health reporting", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.balance.mockResolvedValue({}); });
  it("does not persist provider errors containing credentials", async () => {
    mocks.resolve.mockResolvedValue("sk_test_fakefixture123");
    mocks.balance.mockRejectedValue(new Error("Invalid API key sk_test_fakefixture123"));
    const result = await checkIntegrationConnection("stripe");
    expect(result.status).toBe("degraded");
    expect(JSON.stringify(result)).not.toContain("fakefixture");
  });
  it("does not confuse an authenticated API with complete checkout configuration", async () => {
    mocks.resolve.mockImplementation(async (_provider, slot) => slot === "secret_key" ? "sk_test_fakefixture123" : null);
    expect((await checkIntegrationConnection("stripe")).status).toBe("configuration_required");
    expect(mocks.balance).toHaveBeenCalledOnce();
  });
});
