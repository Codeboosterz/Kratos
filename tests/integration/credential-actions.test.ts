import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ membership: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
import { saveIntegrationCredential } from "@/app/beheer/(protected)/instellingen/actions";

describe("CMS credential write boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("STRIPE_SECRET_KEY", "");
    mocks.membership.mockResolvedValue({ membership: { role: "super_admin" }, supabase: { rpc: mocks.rpc } });
    mocks.rpc.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());
  const form = () => { const data = new FormData(); data.set("provider", "stripe"); data.set("credentialName", "secret_key"); data.set("value", "sk_test_fakefixture123"); return data; };
  it("rejects non-super-admin credential writes", async () => {
    mocks.membership.mockResolvedValue({ membership: { role: "owner" }, supabase: { rpc: mocks.rpc } });
    await expect(saveIntegrationCredential(form())).rejects.toThrow("super-admin-required");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects a secret in the frontend publishable slot", async () => {
    const data = form(); data.set("credentialName", "publishable_key");
    await expect(saveIntegrationCredential(data)).rejects.toThrow("invalid-credential");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("saves through Vault RPC and does not return the secret", async () => {
    await expect(saveIntegrationCredential(form())).rejects.toThrow("status=saved&provider=stripe");
    expect(mocks.rpc).toHaveBeenCalledWith("cms_store_integration_secret", { target_provider: "stripe", target_credential_name: "secret_key", secret_value: "sk_test_fakefixture123" });
  });
  it("explicitly warns when an environment value overrides the saved Vault credential", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_existingfixture");
    await expect(saveIntegrationCredential(form())).rejects.toThrow("saved-environment-priority");
  });
});
