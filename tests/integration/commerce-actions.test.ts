import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ membership: vi.fn(), upsert: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/src/cms/auth", () => ({ requireCmsMembership: mocks.membership }));
import { saveCmsProduct } from "@/app/beheer/(protected)/producten/actions";

describe("owner commerce save invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.upsert.mockResolvedValue({ error: null });
    mocks.membership.mockResolvedValue({ userId: "fixture", membership: { role: "owner" }, supabase: { from: () => ({ upsert: mocks.upsert }) } });
  });
  const form = () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ id: "fixture", slug: "duo-coaching", name: "Fixture", description: "Fixture description", status: "active", price: "123,45", currency: "eur", stripePriceId: "price_existing", stripeProductId: "", trainerizePlanId: "" })) data.set(key, value);
    return data;
  };
  it("preserves entered prices and refreshes dependent purchase routes", async () => {
    await expect(saveCmsProduct(form())).rejects.toThrow("status=saved");
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ price_cents: 12345, stripe_price_id: "price_existing" }), { onConflict: "id" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/trajecten/[slug]", "page");
    expect(mocks.revalidate).toHaveBeenCalledWith("/checkout/[slug]", "page");
  });
  it("keeps editor writes blocked", async () => {
    mocks.membership.mockResolvedValue({ membership: { role: "editor" } });
    await expect(saveCmsProduct(form())).rejects.toThrow("owner-required");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("does not report publication when saving failed", async () => {
    mocks.upsert.mockResolvedValue({ error: { message: "fixture error" } });
    await expect(saveCmsProduct(form())).rejects.toThrow("save-failed");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
