import { expect, test } from "@playwright/test";

test("desktop hero keeps its frame sequence and releases into the offer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.getByTestId("scroll-hero");
  const canvas = page.getByTestId("scroll-hero-canvas");
  await expect(page.locator("#home-title")).toHaveAttribute("aria-label", "Word sterker. Blijf sterker.");
  await expect(page.locator("#home-title .motion-word")).toHaveCount(2);
  await expect(hero).toHaveAttribute("data-sequence-ready", "true", { timeout: 10_000 });
  const height = await hero.evaluate(element => element.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(1100);
  expect(height).toBeLessThan(2000);
  await page.evaluate(distance => window.scrollTo(0, distance * .5), height - 900);
  await expect.poll(async () => Number(await canvas.getAttribute("data-frame")), { timeout: 8_000 }).toBeGreaterThan(20);
  await page.evaluate(distance => window.scrollTo(0, distance), height - 900 + 76);
  await expect.poll(async () => Number(await canvas.getAttribute("data-frame")), { timeout: 8_000 }).toBeGreaterThan(110);
  await expect(page.getByTestId("scroll-hero-end-tagline")).toBeVisible();
  await page.locator("#offer-title").scrollIntoViewIfNeeded();
  await expect(page.locator("#offer-title")).toBeVisible();
});

test("reduced motion keeps the slogan and offer readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#home-title")).toHaveAttribute("aria-label", "Word sterker. Blijf sterker.");
  await expect(page.locator("#home-title .motion-word").first()).toHaveCSS("opacity", "1");
  await expect(page.locator("#offer-title")).toBeVisible();
  await expect(page.getByTestId("scroll-hero-canvas")).toHaveCSS("display", "none");
});
