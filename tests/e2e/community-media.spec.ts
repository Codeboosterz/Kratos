import { expect, test } from "@playwright/test";

test("community uses its existing CMS images without screenshot assets", async ({ page }) => {
  await page.goto("/community");
  await expect(page.locator("main img")).toHaveCount(3);
  await expect.poll(() => page.locator("main img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.locator("main img").evaluateAll(images => images.every(image => !(image as HTMLImageElement).src.includes("screenshots")))).toBe(true);
});
