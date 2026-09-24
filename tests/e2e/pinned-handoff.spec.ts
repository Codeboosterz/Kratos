import { expect, test } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1440]) {
  test(`core public pages have no document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of ["/", "/trajecten", "/trajecten/duo-coaching", "/trajecten/premium-online-coaching", "/over-omar", "/werkwijze", "/community"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), route).toBe(true);
    }
  });
}
