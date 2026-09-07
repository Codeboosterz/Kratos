import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("community grid loads all replacement photos and keeps the original centre", async ({ page }) => {
  await page.setViewportSize({ width: 2013, height: 1604 });
  await page.goto("/");
  const root = page.locator(".community-reveal");
  const grid = root.locator(".community-grid");
  await expect(root).toHaveAttribute("data-community-pin-end", /\d/);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await root.evaluate((element) => {
    const start = Number(element.dataset.communityPinStart);
    const end = Number(element.dataset.communityPinEnd);
    window.scrollTo(0, start + (end - start) * 0.97);
  });
  await expect(root.locator(".community-reveal__caption")).toHaveText("Niet alleen bij Kratos");
  await expect.poll(() => grid.locator(".grid_item").evaluateAll((items) => items.every((item) => (
    Number(getComputedStyle(item).opacity) > 0.99
  )))).toBe(true);
  const sources = await grid.locator("img").evaluateAll((images: HTMLImageElement[]) => images.map((image) => (
    new URL(image.currentSrc || image.src).searchParams.get("url")
  )));
  expect(sources).toHaveLength(15);
  expect(sources[7]).toBe("/images/omar-deadlift.jpg");
  const surrounding = sources.filter((_, index) => index !== 7);
  expect(new Set(surrounding).size).toBe(14);
  expect(surrounding.every((src) => src?.startsWith("/images/community/"))).toBe(true);
  await expect.poll(() => grid.locator("img").evaluateAll((images: HTMLImageElement[]) => images.every((image) => (
    image.complete && image.naturalWidth > 0
  ))), { timeout: 15_000 }).toBe(true);
  expect(await grid.evaluate((element) => Number.parseFloat(getComputedStyle(element).width))).toBeCloseTo(1180 * 1.025, 1);
  const geometry = await grid.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement!.getBoundingClientRect();
    return { left: rect.left - parent.left, right: parent.right - rect.right };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeGreaterThanOrEqual(0);
  await mkdir("artifacts/qa", { recursive: true });
  await page.screenshot({ path: "artifacts/qa/community-photos-desktop.png" });
});

for (const width of [375, 800]) {
  test(`community photos remain visible and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const grid = page.locator(".community-grid");
    await grid.scrollIntoViewIfNeeded();
    await expect(grid.locator(".grid_item")).toHaveCount(15);
    await expect.poll(() => grid.locator(".grid_item").evaluateAll((items) => items.every((item) => (
      getComputedStyle(item).visibility !== "hidden" && Number(getComputedStyle(item).opacity) > 0.99
    )))).toBe(true);
    await expect.poll(() => grid.locator("img").evaluateAll((images: HTMLImageElement[]) => images.every((image) => (
      image.complete && image.naturalWidth > 0
    ))), { timeout: 15_000 }).toBe(true);
    const bounds = await grid.evaluate((element) => ({
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
      pageWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);
    expect(bounds.scrollWidth).toBe(bounds.pageWidth);
    await mkdir("artifacts/qa", { recursive: true });
    await page.screenshot({ path: `artifacts/qa/community-photos-${width}.png` });
  });
}
