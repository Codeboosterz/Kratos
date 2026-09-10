import { spawnSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ membership: vi.fn(), rpc: vi.fn(), single: vi.fn(), revalidate: vi.fn(), admin: vi.fn() }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/src/supabase/admin", () => ({ createAdminClient: mocks.admin }));
import { publishHomeRevision, publishStructuredPageRevision } from "@/app/beheer/(protected)/website/actions";
import { markIntakeRead, updateIntakeLead } from "@/app/beheer/(protected)/inbox/actions";

const id = "2ddaf20d-2527-4d17-a5da-5c731091d08c";
const publication = (slug = "home") => {
  const form = new FormData(); form.set("revision_id", id); form.set("page_slug", slug); return form;
};

describe("CMS operation integrity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const chain = { select: () => chain, update: () => chain, eq: () => chain, maybeSingle: mocks.single,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve) };
    mocks.membership.mockResolvedValue({ userId: id, membership: { role: "owner" }, supabase: { from: () => chain, rpc: mocks.rpc } });
    mocks.rpc.mockResolvedValue({ data: [{ published_version: 2, published_revision_id: id }], error: null });
  });

  it("does not ignore the existing protected Media source page", () => {
    const result = spawnSync("git", ["check-ignore", "--no-index", "--quiet", "app/beheer/(protected)/media/page.tsx"], { encoding: "utf8" });
    expect(result.status).toBe(1); // Git's documented "not ignored" exit status.
    expect(result.error).toBeUndefined();
  });

  it.each([publishHomeRevision, publishStructuredPageRevision])("denies an editor publication before calling the RPC", async (publish) => {
    mocks.membership.mockResolvedValue({ membership: { role: "editor" } });
    expect((await publish({}, publication("gratis-tools"))).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a foreign revision through the homepage action", async () => {
    mocks.single.mockResolvedValueOnce({ data: { page_id: id } }).mockResolvedValueOnce({ data: { slug: "contact" } });
    expect((await publishHomeRevision({}, publication())).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it.each(["home", "trajecten"])("publishes %s and refreshes every consumer", async (slug) => {
    mocks.single.mockResolvedValueOnce({ data: { page_id: id } }).mockResolvedValueOnce({ data: { slug } });
    const action = slug === "home" ? publishHomeRevision : publishStructuredPageRevision;
    expect((await action({}, publication(slug))).status).toBe("success");
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
    if (slug === "trajecten") {
      expect(mocks.revalidate).toHaveBeenCalledWith("/trajecten");
      expect(mocks.revalidate).toHaveBeenCalledWith("/trajecten/[slug]", "page");
    }
  });

  it.each([markIntakeRead, updateIntakeLead])("does not report a missing lead as updated", async (action) => {
    const form = new FormData(); form.set("intakeId", id); form.set("leadStatus", "contacted"); form.set("internalNote", "QA note");
    mocks.single.mockResolvedValue({ data: null, error: null });
    await expect(action(form)).rejects.toThrow("update-failed");
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
});
