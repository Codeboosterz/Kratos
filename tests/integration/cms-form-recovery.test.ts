import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ membership: vi.fn(), single: vi.fn(), rate: vi.fn(), upload: vi.fn(), secret: vi.fn(), completion: vi.fn(), admin: vi.fn() }));
vi.mock("@/src/cms/auth", () => ({ getCmsMembership: mocks.membership }));
vi.mock("@/src/server/rate-limit", () => ({ checkDurableRateLimit: mocks.rate }));
vi.mock("@/src/operations/secrets", () => ({ resolveIntegrationSecret: mocks.secret }));
vi.mock("@/src/operations/openrouter", () => ({ requestStructuredCompletion: mocks.completion }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: mocks.admin }));
import { POST as upload } from "@/app/api/cms/digital-assets/route";
import { POST as generate } from "@/app/api/cms/pdf/generate/route";
import { POST as assist } from "@/app/api/cms/ai/assist/route";

describe("CMS asset and AI form boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = { select: () => chain, eq: () => chain, insert: () => chain, update: () => chain, maybeSingle: mocks.single, single: mocks.single };
    const db = { from: () => chain, storage: { from: () => ({ upload: mocks.upload, remove: vi.fn() }) } };
    mocks.membership.mockResolvedValue({ membership: { role: "owner" }, userId: "fixture", supabase: db });
    mocks.admin.mockReturnValue(db); mocks.rate.mockResolvedValue({ allowed: true }); mocks.secret.mockResolvedValue("fixture-secret");
    mocks.single.mockResolvedValue({ data: null, error: null }); mocks.upload.mockResolvedValue({ error: null });
  });
  const json = (body: unknown) => new Request("http://localhost/api/cms/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const pdf = () => { const body = new FormData(); body.set("productId", "missing-product"); body.set("file", new File(["%PDF-1.7\nQA"], "qa.pdf", { type: "application/pdf" })); return new Request("http://localhost/api/cms/digital-assets", { method: "POST", body }); };
  const generation = () => json({ productId: "missing-product", title: "QA document", audience: "QA testers", objective: "Verify boundaries", sourceNotes: "Approved fixture content for testing only." });

  it.each([upload, generate, assist])("denies anonymous mutations", async (post) => {
    mocks.membership.mockResolvedValue(null);
    expect((await post(json({}))).status).toBe(401); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it.each([upload, generate])("denies editor asset changes", async (post) => {
    mocks.membership.mockResolvedValue({ membership: { role: "editor" } });
    expect((await post(json({}))).status).toBe(403); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("returns a safe 400 for malformed upload form data", async () => {
    expect((await upload(json({}))).status).toBe(400);
  });
  it("does not upload a PDF for a missing product", async () => {
    expect((await upload(pdf())).status).toBe(404); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("does not start paid generation for a missing product", async () => {
    expect((await generate(generation())).status).toBe(404); expect(mocks.completion).not.toHaveBeenCalled(); expect(mocks.secret).not.toHaveBeenCalled();
  });
  it("does not spend on AI after job persistence fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: "offline" } });
    const response = await assist(json({ purpose: "rewrite", objective: "QA concept", source: "Approved fixture content for testing only.", tone: "direct" }));
    expect(response.status).toBe(502); expect(mocks.completion).not.toHaveBeenCalled();
  });
  it("does not report linked when the product disappears after upload", async () => {
    mocks.single.mockResolvedValueOnce({ data: { id: "missing-product" }, error: null }).mockResolvedValueOnce({ data: { id: "asset" }, error: null }).mockResolvedValueOnce({ data: null, error: null });
    const response = await upload(pdf());
    expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ error: { code: "PRODUCT_LINK_FAILED" } });
  });
});
