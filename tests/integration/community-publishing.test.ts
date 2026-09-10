import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ membership: vi.fn(), rpc: vi.fn(), single: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveStructuredPageRevision, publishStructuredPageRevision } from "@/app/beheer/(protected)/website/actions";
import { cmsPageDefaults, getCmsPageDefinition } from "@/src/cms/site-page-definitions";

describe("community CMS save and publish wiring", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const chain = { eq: () => chain, maybeSingle: mocks.single };
    mocks.membership.mockResolvedValue({ membership: { role: "owner" }, supabase: { rpc: mocks.rpc, from: () => ({ select: () => chain }) } });
  });
  it("saves a community draft to the existing page record", async () => {
    const data = new FormData();
    data.set("page_slug", "gratis-tools");
    Object.entries(cmsPageDefaults(getCmsPageDefinition("gratis-tools")!)).forEach(([key, value]) => data.set(key, value));
    data.set("community_hero_title", "Samen groeien");
    mocks.rpc.mockResolvedValue({ data: [{ revision_id: "fixture", revision_version: 3 }], error: null });
    expect((await saveStructuredPageRevision({}, data)).status).toBe("success");
    expect(mocks.rpc).toHaveBeenCalledWith("cms_save_content_revision", expect.objectContaining({ target_slug: "gratis-tools", revision_content: expect.objectContaining({ community_hero_title: "Samen groeien" }) }));
  });
  it("does not substitute defaults for missing form fields during a save", async () => {
    const data = new FormData(); data.set("page_slug", "gratis-tools");
    expect((await saveStructuredPageRevision({}, data)).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["gratis-tools", "site-settings"])("publishes %s and refreshes its public consumer", async (slug) => {
    const data = new FormData(); data.set("page_slug", slug); data.set("revision_id", "2ddaf20d-2527-4d17-a5da-5c731091d08c");
    mocks.single.mockResolvedValueOnce({ data: { page_id: "fixture" } }).mockResolvedValueOnce({ data: { slug } });
    mocks.rpc.mockResolvedValue({ data: [{ published_version: 3, published_revision_id: "fixture" }], error: null });
    expect((await publishStructuredPageRevision({}, data)).status).toBe("success");
    if (slug === "site-settings") expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout");
    else expect(mocks.revalidate).toHaveBeenCalledWith("/community");
  });
  it("rejects publication of a draft from a different page", async () => {
    const data = new FormData(); data.set("page_slug", "gratis-tools"); data.set("revision_id", "2ddaf20d-2527-4d17-a5da-5c731091d08c");
    mocks.single.mockResolvedValueOnce({ data: { page_id: "fixture" } }).mockResolvedValueOnce({ data: { slug: "contact" } });
    expect((await publishStructuredPageRevision({}, data)).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
